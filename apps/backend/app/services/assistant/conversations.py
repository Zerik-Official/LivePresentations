from __future__ import annotations

import json

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AIConversation, AIMessage

MAX_CONTEXT_MESSAGES = 60
CANCELLED_TOOL_RESULT = "Cancelled: the user stopped the assistant before this tool ran."


async def get_or_create_conversation(db: AsyncSession, user_id: str, presentation_id: str) -> AIConversation:
    """Load the conversation of a user about a presentation, creating it once.

    Args:
        db: Database session.
        user_id: Owner of the conversation.
        presentation_id: Presentation the chat is about.

    Returns:
        Persisted conversation.
    """
    result = await db.execute(select(AIConversation).where(AIConversation.user_id == user_id, AIConversation.presentation_id == presentation_id))
    conversation = result.scalar_one_or_none()
    if conversation is None:
        conversation = AIConversation(user_id=user_id, presentation_id=presentation_id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    return conversation


async def list_messages(db: AsyncSession, conversation_id: str) -> list[AIMessage]:
    """List the messages of a conversation in order.

    Args:
        db: Database session.
        conversation_id: Conversation id.

    Returns:
        Messages, oldest first.
    """
    result = await db.execute(select(AIMessage).where(AIMessage.conversation_id == conversation_id).order_by(AIMessage.position))
    return list(result.scalars().all())


async def append_message(
    db: AsyncSession,
    conversation_id: str,
    role: str,
    content: str,
    *,
    tool_calls: list[dict[str, str]] | None = None,
    tool_call_id: str | None = None,
    summary: str | None = None,
    ok: bool | None = None,
    input_tokens: int | None = None,
    output_tokens: int | None = None,
) -> AIMessage:
    """Append a message to a conversation.

    Args:
        db: Database session.
        conversation_id: Conversation id.
        role: `user`, `assistant` or `tool`.
        content: Message text, or the tool result sent to the model.
        tool_calls: Tool calls requested by an assistant message.
        tool_call_id: Call a tool message answers.
        summary: Label of a tool result for the chat UI.
        ok: Whether a tool call succeeded.
        input_tokens: Prompt tokens of the request that produced an assistant message.
        output_tokens: Completion tokens of that request.

    Returns:
        Stored message.
    """
    last = await db.execute(select(func.coalesce(func.max(AIMessage.position), -1)).where(AIMessage.conversation_id == conversation_id))
    message = AIMessage(
        conversation_id=conversation_id,
        position=int(last.scalar_one()) + 1,
        role=role,
        content=content,
        tool_calls=json.dumps(tool_calls) if tool_calls else None,
        tool_call_id=tool_call_id,
        summary=summary[:300] if summary else None,
        ok=ok,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )
    db.add(message)
    await db.commit()
    return message


async def clear_messages(db: AsyncSession, conversation_id: str) -> None:
    """Delete every message of a conversation; token totals are kept.

    Args:
        db: Database session.
        conversation_id: Conversation id.
    """
    await db.execute(delete(AIMessage).where(AIMessage.conversation_id == conversation_id).execution_options(synchronize_session=False))
    await db.commit()


def read_tool_calls(message: AIMessage) -> list[dict[str, str]]:
    """Decode the tool calls stored on an assistant message.

    Args:
        message: Stored message.

    Returns:
        Tool calls as `{id, name, arguments}`, empty when there are none.
    """
    if not message.tool_calls:
        return []
    try:
        calls = json.loads(message.tool_calls)
    except ValueError:
        return []
    return [call for call in calls if isinstance(call, dict)]


def to_client_message(message: AIMessage) -> dict[str, object]:
    """Serialize a message for the chat UI.

    Args:
        message: Stored message.

    Returns:
        Message without tool arguments or raw tool results.
    """
    return {
        "id": message.id,
        "role": message.role,
        "content": message.content if message.role != "tool" else "",
        "tool_calls": [{"id": call.get("id", ""), "name": call.get("name", "")} for call in read_tool_calls(message)],
        "tool_call_id": message.tool_call_id,
        "summary": message.summary,
        "ok": message.ok,
        "input_tokens": message.input_tokens or 0,
        "output_tokens": message.output_tokens or 0,
    }


def _wire_tool_call(call: dict[str, str]) -> dict[str, object]:
    """Convert a stored tool call to the chat-completions format.

    Provider data received with the call (`extra_content`, where Gemini puts
    the thought signature it requires back) is returned unchanged.

    Args:
        call: Stored call with id, name, arguments and optional extra content.

    Returns:
        Tool call ready to send.
    """
    wire: dict[str, object] = {"id": call.get("id", ""), "type": "function", "function": {"name": call.get("name", ""), "arguments": call.get("arguments", "{}")}}
    try:
        extra = json.loads(call["extra_content"]) if call.get("extra_content") else None
    except ValueError:
        extra = None
    if isinstance(extra, dict):
        wire["extra_content"] = extra
    return wire


def to_model_messages(messages: list[AIMessage]) -> list[dict[str, object]]:
    """Convert stored messages to the chat-completions wire format.

    Only the most recent messages are sent, starting at a user message. A turn
    stopped midway can leave tool calls without results, which providers
    reject, so those get a synthetic "cancelled" result.

    Args:
        messages: Stored messages, oldest first.

    Returns:
        Messages ready to send after the system prompt.
    """
    start = max(0, len(messages) - MAX_CONTEXT_MESSAGES)
    while start < len(messages) and messages[start].role != "user":
        start += 1
    recent = messages[start:]

    wire: list[dict[str, object]] = []
    index = 0
    while index < len(recent):
        message = recent[index]
        index += 1
        if message.role == "tool":
            continue
        entry: dict[str, object] = {"role": message.role, "content": message.content}
        calls = read_tool_calls(message) if message.role == "assistant" else []
        if calls:
            entry["tool_calls"] = [_wire_tool_call(call) for call in calls]
        wire.append(entry)
        if not calls:
            continue
        results: dict[str | None, str] = {}
        while index < len(recent) and recent[index].role == "tool":
            results[recent[index].tool_call_id] = recent[index].content
            index += 1
        for call in calls:
            wire.append({"role": "tool", "tool_call_id": call.get("id", ""), "content": results.get(call.get("id"), CANCELLED_TOOL_RESULT)})
    return wire
