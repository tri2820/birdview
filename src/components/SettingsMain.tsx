import { appConfig } from "../utils";
import MonacoEditor from "./MonacoEditor";
import { createSignal, untrack } from 'solid-js';

export default function SettingsMain() {

    const [configContent, setConfigContent] = createSignal(JSON.stringify(appConfig(), null, 2));

    const handleSave = async () => {
        try {
            const parsedConfig = JSON.parse(configContent());
            const res = await fetch('/api/v1/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ config: parsedConfig })
            });
            if (res.ok) {
                alert('Config saved!');
            } else {
                const error = await res.json();
                alert(`Error saving config: ${JSON.stringify(error, null, 2)}`);
            }
        } catch (e) {
            alert(`Error saving config: ${e}`);
        }
    };

    return (
        <div class="h-screen flex flex-col border-l border-neutral-800 bg-neutral-900">
            <div class="flex-none px-4 h-14 text-lg bg-neutral-900 border-b border-neutral-800 flex items-center space-x-4">
                <div class="text-white font-bold">Settings</div>

                <div class="flex-1" />

                <button class="btn-secondary" onClick={handleSave}>
                    Save
                </button>
            </div>

            <div class="flex-1 flex flex-col">
                <MonacoEditor
                    language="json"
                    value={untrack(() => configContent())}
                    onChange={(newValue) => {
                        setConfigContent(newValue);
                    }}
                    theme="vs-dark"
                    options={{ fontSize: 14 }}
                />

            </div>
        </div>


    );
}
