import { FormEvent, useEffect, useState } from "react";

import { providerConfigs } from "../i18n";
import type { CopyBundle, ProviderConfig } from "../i18n";
import type { ProviderVendor, RuntimeSettings } from "../types/dto";

interface SettingsPageProps {
  open: boolean;
  loading: boolean;
  settings: RuntimeSettings | null;
  onClose: () => void;
  onSave: (vendor: ProviderVendor, apiKey: string, apiBaseUrl: string, modelName: string) => Promise<void>;
  onTestConnection: (vendor: ProviderVendor, apiKey: string, apiBaseUrl: string) => Promise<{ success: boolean; message: string }>;
  onFetchModels: (vendor: ProviderVendor, apiKey: string, apiBaseUrl: string) => Promise<string[]>;
  copy: CopyBundle;
  providerVendor: ProviderVendor;
}

export default function SettingsPage(props: SettingsPageProps): JSX.Element | null {
  const { open, loading, settings, onClose, onSave, onTestConnection, onFetchModels, copy, providerVendor } = props;

  const [draftVendor, setDraftVendor] = useState<ProviderVendor>(providerVendor);
  const [apiKey, setApiKey] = useState<string>(settings?.apiKey ?? "");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(settings?.apiBaseUrl ?? providerConfigs[providerVendor].apiBaseUrl);
  const [modelName, setModelName] = useState<string>(settings?.modelName ?? providerConfigs[providerVendor].modelName);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [pullingModels, setPullingModels] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setDraftVendor(providerVendor);
    setApiKey(settings?.apiKey ?? "");
    setApiBaseUrl(settings?.apiBaseUrl ?? providerConfigs[providerVendor].apiBaseUrl);
    setModelName(settings?.modelName ?? providerConfigs[providerVendor].modelName);
    setAvailableModels(settings?.modelName ? [settings.modelName] : []);
    setTestResult(null);
    setError(null);
  }, [settings, open, providerVendor]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    await onSave(draftVendor, apiKey, apiBaseUrl, modelName);
  };

  const handleTestConnection = async (): Promise<void> => {
    setError(null);
    setTestResult(null);
    setTesting(true);

    try {
      const result = await onTestConnection(draftVendor, apiKey, apiBaseUrl);
      setTestResult(result);
    } catch (testError) {
      const message = testError instanceof Error ? testError.message : copy.connectionFailed;
      setTestResult({ success: false, message });
    } finally {
      setTesting(false);
    }
  };

  const handlePullModels = async (): Promise<void> => {
    setError(null);
    setPullingModels(true);

    try {
      const models = await onFetchModels(draftVendor, apiKey, apiBaseUrl);
      setAvailableModels(models);
      if (models.length > 0) {
        setModelName((current) => (models.includes(current) ? current : models[0]));
      }
    } catch (pullError) {
      const message = pullError instanceof Error ? pullError.message : copy.noModelsAvailable;
      setError(message);
    } finally {
      setPullingModels(false);
    }
  };

  const currentConfig: ProviderConfig = providerConfigs[draftVendor];

  const handleVendorChange = (vendor: ProviderVendor): void => {
    const config = providerConfigs[vendor];
    setDraftVendor(vendor);
    setApiBaseUrl(config.apiBaseUrl);
    setModelName(config.modelName);
    setAvailableModels(config.modelName ? [config.modelName] : []);
    setTestResult(null);
    setError(null);
  };

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true">
      <div className="settings-panel">
        <div className="settings-head">
          <h3>{copy.modelConfigTitle}</h3>
          <button className="ghost-btn" type="button" onClick={onClose}>
            {copy.close}
          </button>
        </div>
        {!settings ? (
          <p className="settings-loading">{copy.sending}</p>
        ) : (
          <form className="settings-form" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              {copy.provider}
              <select value={draftVendor} onChange={(event) => handleVendorChange(event.target.value as ProviderVendor)}>
                <option value="mock">{copy.providerMock}</option>
                <option value="openai">{copy.providerOpenAI}</option>
                <option value="doubao">{copy.providerDoubao}</option>
                <option value="deepseek">{copy.providerDeepSeek}</option>
                <option value="kimi">{copy.providerKimi}</option>
              </select>
            </label>
            <label>
              {copy.apiKey}
              <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." />
            </label>
            <label>
              {copy.serviceUrl}
              <input type="text" value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} placeholder="https://api.example.com/v1" />
            </label>
            <div className="provider-hint">
              <span>{copy.providerBaseUrl}: {currentConfig.apiBaseUrl || copy.providerMock}</span>
              <span>{copy.providerModelName}: {currentConfig.modelName}</span>
            </div>
            <div className="settings-model-row">
              <label className="settings-model-field">
                {copy.modelName}
                <input
                  type="text"
                  value={modelName}
                  onChange={(event) => setModelName(event.target.value)}
                  placeholder={availableModels.length === 0 ? copy.noModelsAvailable : currentConfig.modelName}
                />
              </label>
              <button className="ghost-btn" type="button" onClick={() => void handlePullModels()} disabled={pullingModels}>
                {pullingModels ? copy.pullingModels : copy.pullModels}
              </button>
            </div>
            {availableModels.length > 0 ? (
              <div className="model-picker-list" role="listbox" aria-label={copy.modelName}>
                {availableModels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`model-picker-item ${item === modelName ? "active" : ""}`}
                    onClick={() => setModelName(item)}
                    title={item}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            {testResult ? (
              <p className={`settings-result ${testResult.success ? "success" : "failed"}`}>{testResult.message}</p>
            ) : null}
            {error ? <p className="settings-error">{error}</p> : null}
            <div className="settings-actions">
              <button className="ghost-btn" type="button" onClick={() => void handleTestConnection()} disabled={loading || testing}>
                {testing ? copy.testingConnection : copy.testConnection}
              </button>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? copy.saving : copy.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
