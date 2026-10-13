"""Tools the assistant may call.

The backend owns the definitions shown to the model; the editor executes the
calls against the live document and reports the results back over the
WebSocket. Handlers live in `apps/frontend/src/features/assistant/tools.ts`
and must keep the same names and arguments.
"""

from __future__ import annotations

CREATABLE_TYPES = ["text", "shape", "line", "table", "code", "icon", "image"]
TRANSITIONS = ["fade", "slide", "zoom"]

_ELEMENT_PROPS: dict[str, object] = {
    "type": "object",
    "description": "Type-specific properties; omitted ones keep their defaults.",
    "properties": {
        "text": {"type": "string", "description": "text: content, may contain line breaks"},
        "fontSize": {"type": "number", "description": "text/table: size in pixels"},
        "color": {"type": "string", "description": "text/line/icon: color as #rrggbb"},
        "align": {"type": "string", "enum": ["left", "center", "right", "justify"], "description": "text"},
        "bold": {"type": "boolean", "description": "text"},
        "italic": {"type": "boolean", "description": "text"},
        "fontFamily": {"type": "string", "description": "text: Inter, Poppins, Playfair Display, Roboto, Montserrat, Oswald, Lora, JetBrains Mono, Space Grotesk, Merriweather, DM Sans or Bebas Neue"},
        "lineHeight": {"type": "number", "description": "text"},
        "backgroundEnabled": {"type": "boolean", "description": "text: paint a background behind the text"},
        "backgroundColor": {"type": "string", "description": "text"},
        "backgroundRadius": {"type": "number", "description": "text"},
        "backgroundPadding": {"type": "number", "description": "text"},
        "variant": {"type": "string", "description": "shape: rect, circle, pill, triangle, diamond, pentagon, hexagon, octagon, star, parallelogram, trapezoid, arrow-right, arrow-left, chevron, cross or bubble. line: line, arrow or double-arrow"},
        "fill": {"type": "string", "description": "shape: fill color"},
        "radius": {"type": "number", "description": "shape: corner radius of rect"},
        "borderColor": {"type": "string", "description": "shape/table"},
        "borderWidth": {"type": "number", "description": "shape: only rect, circle and pill show a border"},
        "opacity": {"type": "number", "description": "text/shape: 0 to 1"},
        "width": {"type": "number", "description": "line: stroke width"},
        "dash": {"type": "string", "enum": ["solid", "dashed", "dotted"], "description": "line"},
        "rows": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}, "description": "table: cell texts by row"},
        "headerRow": {"type": "boolean", "description": "table: style the first row as header"},
        "textColor": {"type": "string", "description": "table"},
        "headerBackground": {"type": "string", "description": "table"},
        "headerTextColor": {"type": "string", "description": "table"},
        "cellBackground": {"type": "string", "description": "table"},
        "code": {"type": "string", "description": "code: source code"},
        "language": {"type": "string", "description": "code: e.g. javascript, python, typescript"},
        "name": {"type": "string", "description": "icon: react-icons Font Awesome 5 name such as FaRocket, FaChartLine, FaUsers"},
        "size": {"type": "number", "description": "icon: glyph size in pixels"},
        "src": {"type": "string", "description": "image: absolute https URL"},
        "alt": {"type": "string", "description": "image"},
        "fit": {"type": "string", "enum": ["cover", "contain", "fill", "none"], "description": "image"},
    },
}

_ELEMENT_SPEC: dict[str, object] = {
    "type": "object",
    "description": "Element placed with absolute coordinates in slide pixels, origin at the top-left corner.",
    "properties": {
        "type": {"type": "string", "enum": CREATABLE_TYPES},
        "x": {"type": "number", "description": "Left edge"},
        "y": {"type": "number", "description": "Top edge"},
        "w": {"type": "number", "description": "Width"},
        "h": {"type": "number", "description": "Height"},
        "rotation": {"type": "number", "description": "Degrees clockwise; use it to angle lines"},
        "props": _ELEMENT_PROPS,
    },
    "required": ["type", "x", "y", "w", "h"],
}

_SLIDE_INDEX: dict[str, object] = {"type": "integer", "description": "Zero-based slide index"}


def _tool(name: str, description: str, properties: dict[str, object], required: list[str] | None = None) -> dict[str, object]:
    """Build a tool definition in the chat-completions format.

    Args:
        name: Tool name.
        description: What the tool does and when to use it.
        properties: JSON schema of each argument.
        required: Names of the mandatory arguments.

    Returns:
        Tool definition.
    """
    parameters: dict[str, object] = {"type": "object", "properties": properties}
    if required:
        parameters["required"] = required
    return {"type": "function", "function": {"name": name, "description": description, "parameters": parameters}}


ASSISTANT_TOOLS: list[dict[str, object]] = [
    _tool(
        "get_presentation",
        "Read the current presentation: title, canvas size, theme and every slide with its elements. Call it before editing existing content.",
        {"slide_index": {"type": "integer", "description": "Only return this slide; omit for all slides"}},
    ),
    _tool(
        "add_slide",
        "Create a slide, optionally with its elements, and return its index. Build each slide in one call.",
        {
            "index": {"type": "integer", "description": "Position to insert at; omit to append"},
            "background": {"type": "string", "description": "CSS color, default #ffffff"},
            "transition": {"type": "string", "enum": TRANSITIONS},
            "notes": {"type": "string", "description": "Speaker notes"},
            "elements": {"type": "array", "items": _ELEMENT_SPEC},
        },
    ),
    _tool(
        "update_slide",
        "Change the background, transition or notes of a slide.",
        {"slide_index": _SLIDE_INDEX, "background": {"type": "string"}, "transition": {"type": "string", "enum": TRANSITIONS}, "notes": {"type": "string"}},
        ["slide_index"],
    ),
    _tool("delete_slide", "Delete a slide and all of its elements.", {"slide_index": _SLIDE_INDEX}, ["slide_index"]),
    _tool("move_slide", "Move a slide to another position.", {"from_index": _SLIDE_INDEX, "to_index": _SLIDE_INDEX}, ["from_index", "to_index"]),
    _tool(
        "add_elements",
        "Add elements to an existing slide and return their ids. Later elements are drawn on top.",
        {"slide_index": _SLIDE_INDEX, "elements": {"type": "array", "items": _ELEMENT_SPEC}},
        ["slide_index", "elements"],
    ),
    _tool(
        "update_element",
        "Move, resize, rotate or restyle an element. Only the provided fields and props change.",
        {
            "slide_index": _SLIDE_INDEX,
            "element_id": {"type": "string"},
            "x": {"type": "number"},
            "y": {"type": "number"},
            "w": {"type": "number"},
            "h": {"type": "number"},
            "rotation": {"type": "number"},
            "props": _ELEMENT_PROPS,
        },
        ["slide_index", "element_id"],
    ),
    _tool("delete_element", "Delete an element from a slide.", {"slide_index": _SLIDE_INDEX, "element_id": {"type": "string"}}, ["slide_index", "element_id"]),
    _tool("set_title", "Rename the presentation.", {"title": {"type": "string"}}, ["title"]),
]
