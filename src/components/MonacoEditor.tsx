import { onCleanup, createSignal, createEffect } from 'solid-js';
// CHANGE 1: Remove loader, import monaco directly.
import * as monaco from 'monaco-editor';

// CHANGE 2: Add worker imports and environment setup.
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        return new editorWorker();
    },
};

function MonacoEditor(props: {
    value?: string;
    language?: string;
    theme?: string;
    options?: any;
    onChange?: (value: string) => void;
}) {
    // YOUR CODE: Signal ref is kept exactly as is.
    const [editorRef, setEditorRef] = createSignal<HTMLDivElement>();

    // YOUR CODE: createEffect structure is kept.
    createEffect(() => {
        const ref = editorRef();
        if (!ref) return;

        // Add a guard to prevent re-initialization error
        if (ref.innerHTML !== '') {
            ref.innerHTML = '';
        }

        const editorInstance = monaco.editor.create(ref, {
            value: props.value || '// Start typing here...',
            language: props.language || 'javascript',
            theme: props.theme || 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            ...props.options
        });

        let disposed = false;
        onCleanup(() => {
            disposed = true;
            console.log('Disposing editor instance');
            editorInstance.dispose();
        });

        // Handle content changes
        editorInstance.onDidChangeModelContent(() => {
            if (disposed) return;
            if (typeof props.onChange === 'function') {
                props.onChange(editorInstance.getValue());
            }
        });
    });

    return <div ref={setEditorRef} class="flex-1" />;
}

export default MonacoEditor;