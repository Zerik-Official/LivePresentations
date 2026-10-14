import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiKey, FiLock, FiTrash2 } from "react-icons/fi";

import { Button } from "@/components/ui/Button";
import { Modal, ModalBody, ModalHeader } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { aiApi } from "@/lib/api";
import { useAiStore } from "@/stores/aiStore";
import type { AiProvider, AiUsageSummary } from "@/types/backend";
import { UsageCharts } from "./UsageCharts";

type Tab = "keys" | "usage";

const PERIODS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
];

const INPUT_CLASS = "w-full rounded-lg border bg-(--input-bg) border-(--input-border) text-(--input-text) px-3 py-2 text-sm outline-none placeholder:text-(--input-placeholder) focus:border-zinc-900 dark:focus:border-zinc-300";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * AI assistant settings: bring-your-own API keys per provider and a token
 * usage dashboard. Keys are sent once, encrypted on the server and never
 * returned; only a masked hint is displayed.
 * @param open - Visibility
 * @param onClose - Close handler
 * @returns Settings modal
 */
export function AiSettingsModal({ open, onClose }: Props): React.ReactNode {
  const credentials = useAiStore((s) => s.credentials);
  const loadCredentials = useAiStore((s) => s.load);
  const [tab, setTab] = useState<Tab>("keys");
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [providerId, setProviderId] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [period, setPeriod] = useState("30");
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);

  const provider = useMemo(() => providers.find((p) => p.id === providerId) ?? null, [providers, providerId]);
  const stored = useMemo(() => credentials.find((c) => c.provider === providerId) ?? null, [credentials, providerId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    setApiKey("");
    void loadCredentials();
    void aiApi
      .listProviders()
      .then(setProviders)
      .catch(() => setError("No se pudieron cargar los proveedores"));
  }, [open, loadCredentials]);

  useEffect(() => {
    setApiKey("");
    setModels([]);
    setModel(stored?.model ?? "");
    setBaseUrl(stored?.base_url ?? "");
    // Reset the form only when switching provider, not on every credential refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, open]);

  useEffect(() => {
    if (!open || tab !== "usage") return;
    let cancelled = false;
    setUsage(null);
    void aiApi
      .fetchUsage(Number(period))
      .then((summary) => {
        if (!cancelled) setUsage(summary);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el consumo");
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, period]);

  /**
   * Fetch the models available to the key, validating it on the way.
   */
  async function handleLoadModels(): Promise<void> {
    setError(null);
    setNotice(null);
    setLoadingModels(true);
    try {
      const list = await aiApi.listModels(providerId, apiKey.trim() || undefined, baseUrl.trim() || undefined);
      setModels(list);
      if (list.length === 0) setError("El proveedor no devolvió ningún modelo; escribe el nombre a mano.");
      else if (!list.includes(model)) setModel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los modelos");
    } finally {
      setLoadingModels(false);
    }
  }

  /**
   * Save the key and model, making this provider the active one.
   */
  async function handleSave(): Promise<void> {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      await aiApi.saveCredential(providerId, { apiKey: apiKey.trim() || undefined, model: model.trim(), baseUrl: baseUrl.trim() || undefined });
      await loadCredentials();
      setApiKey("");
      setNotice("Clave guardada. El asistente ya está disponible en el editor.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la clave");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Run a credential action and refresh the list.
   * @param action - API call to perform
   * @param success - Notice shown when it succeeds
   */
  async function runAction(action: () => Promise<unknown>, success: string): Promise<void> {
    setError(null);
    setNotice(null);
    try {
      await action();
      await loadCredentials();
      setNotice(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción");
    }
  }

  const canLoadModels = Boolean(apiKey.trim() || stored) && (!provider?.requires_base_url || Boolean(baseUrl.trim()));
  const canSave = Boolean(model.trim()) && Boolean(apiKey.trim() || stored) && (!provider?.requires_base_url || Boolean(baseUrl.trim()));
  const tabClass = (value: Tab): string =>
    `flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === value ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"}`;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-xl max-h-[88vh]">
      <ModalHeader title="Asistente de IA" subtitle="Usa tu propia clave API y consulta tu consumo" onClose={onClose} />
      <ModalBody>
        <div className="flex shrink-0 gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "keys"} className={tabClass("keys")} onClick={() => setTab("keys")}>
            Claves API
          </button>
          <button type="button" role="tab" aria-selected={tab === "usage"} className={tabClass("usage")} onClick={() => setTab("usage")}>
            Consumo
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FiCheckCircle className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {tab === "keys" ? (
          <>
            {credentials.length > 0 && (
              <ul className="flex flex-col gap-2">
                {credentials.map((credential) => (
                  <li key={credential.provider} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 px-3 py-2.5">
                    <FiKey size={15} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {credential.label}
                        {credential.is_active && <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">En uso</span>}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {credential.model} · clave {credential.key_hint}
                      </p>
                    </div>
                    {!credential.is_active && (
                      <Button variant="secondary" size="sm" onClick={() => void runAction(() => aiApi.activateCredential(credential.provider), `Ahora se usa ${credential.label}`)}>
                        Usar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" aria-label={`Eliminar clave de ${credential.label}`} onClick={() => void runAction(() => aiApi.deleteCredential(credential.provider), "Clave eliminada")}>
                      <FiTrash2 size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{stored ? "Actualizar proveedor" : "Añadir proveedor"}</h3>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Proveedor
                <Select value={providerId} options={providers.map((p) => ({ value: p.id, label: p.label }))} onChange={setProviderId} placeholder="Proveedor" />
              </label>

              {provider?.requires_base_url && (
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  URL base
                  <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://mi-servidor.com/v1" className={`mt-1 ${INPUT_CLASS}`} />
                </label>
              )}

              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center justify-between">
                  Clave API
                  {provider?.key_url && (
                    <a href={provider.key_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-normal text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                      Conseguir una clave <FiExternalLink size={11} />
                    </a>
                  )}
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                  placeholder={stored ? `Guardada (${stored.key_hint}); déjala vacía para conservarla` : "Pega aquí tu clave"}
                  className={`mt-1 ${INPUT_CLASS}`}
                />
              </label>

              <div className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Modelo
                <div className="mt-1 flex gap-2">
                  <div className="min-w-0 flex-1">
                    {models.length > 0 ? (
                      <Select value={model} options={models.map((m) => ({ value: m, label: m }))} onChange={setModel} placeholder="Elige un modelo" />
                    ) : (
                      <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Nombre del modelo" aria-label="Modelo" className={INPUT_CLASS} />
                    )}
                  </div>
                  <Button variant="secondary" size="md" disabled={!canLoadModels || loadingModels} onClick={() => void handleLoadModels()} className="shrink-0">
                    {loadingModels ? <Spinner className="size-3.5" /> : null} Cargar modelos
                  </Button>
                </div>
                <p className="mt-1.5 font-normal text-zinc-500 dark:text-zinc-400">Elige un modelo con llamadas a funciones (tool calling); sin ellas el asistente no puede editar las diapositivas.</p>
              </div>

              <Button variant="primary" disabled={!canSave || saving} onClick={() => void handleSave()}>
                {saving ? <Spinner className="size-4 text-white dark:text-zinc-900" /> : null} Guardar y usar
              </Button>
            </div>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              <FiLock size={13} className="mt-0.5 shrink-0" />
              Tu clave se cifra en el servidor y no se vuelve a mostrar: solo tú puedes usarla y aquí verás únicamente sus últimos caracteres. Las peticiones al proveedor se hacen desde el servidor y el coste corre a cargo de tu cuenta con ese proveedor.
            </p>
          </>
        ) : (
          <>
            <div className="w-48 shrink-0">
              <Select value={period} options={PERIODS} onChange={setPeriod} placeholder="Periodo" />
            </div>
            {usage ? (
              <UsageCharts summary={usage} />
            ) : (
              <div className="flex justify-center py-10">
                <Spinner className="size-5 text-zinc-500" />
              </div>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
