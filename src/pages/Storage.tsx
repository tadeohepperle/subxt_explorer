import { Navigate, useParams } from "@solidjs/router";
import { MdBookWrapper } from "../components/MdBookWrapper";
import { AppState, StorageEntryContent, appState } from "../state/app_state";
import { JSX, Show, createSignal } from "solid-js";
import { marked } from "marked";
import { Code } from "../components/Code";
import { Docs } from "../components/Docs";
import { CodeTabLayout } from "../components/CodeTabLayout";
import {
  KeyValueTypesLayout,
  sectionHeading,
} from "../components/KeyValueTypesLayout";
export const StoragePage = () => {
  let params = useParams<{ pallet: string }>();
  return (
    <MdBookWrapper>
      {storagePageContent(appState(), params.pallet)}
    </MdBookWrapper>
  );
};

function storagePageContent(
  state: AppState | undefined,
  pallet_name: string
): JSX.Element {
  let entries = state?.palletStorageEntries(pallet_name);
  if (entries === undefined) {
    return <Navigate href={"/"} />;
  } else {
    return (
      <>
        <h1>{pallet_name} Pallet: Storage Entries</h1>
        There are {entries.length} storage entries on the {pallet_name} Pallet.
        {entries.map((entry) => storageEntryContent(state!, entry))}
      </>
    );
  }
}

// undefined for storage entries that require keys to be fetched.
type StorageValueState =
  | undefined
  | { tag: "loading" }
  | { tag: "error" }
  | { tag: "value"; value: string };

function storageEntryContent(
  state: AppState,
  entry: StorageEntryContent
): JSX.Element {
  let [storageValue, setStorageValue] = createSignal<StorageValueState>();

  async function fetchStorageValue() {
    setStorageValue({ tag: "loading" });
    const result = await state.fetchKeylessStorageValue(
      entry.pallet_name,
      entry.name
    );
    if (result !== undefined) {
      setStorageValue({ tag: "value", value: result });
    } else {
      setStorageValue({ tag: "error" });
    }
  }
  // fetch the value in storage when the component is loaded
  if (entry.key_types.length === 0 && state.source.tag == "url") {
    fetchStorageValue();
  }

  return (
    <>
      <h2>{entry.name}</h2>
      <Docs mdDocs={entry.docs}></Docs>
      <div>
        <KeyValueTypesLayout
          keyTypes={{
            title:
              entry.key_types.length == 0
                ? "Accessed without Key"
                : entry.key_types.length == 1
                ? "Key Type"
                : "Key Types",
            types: {
              tag: "unnamed",
              types: entry.key_types,
            },
          }}
          valueType={{
            title: "Value Type",
            type: entry.value_type,
          }}
        ></KeyValueTypesLayout>
        <Show when={entry.key_types.length === 0}>
          {sectionHeading("Value")}
          <table class="mx-0 my-8">
            <tbody>
              <tr>
                <td>
                  <button
                    onClick={fetchStorageValue}
                    class={`btn ${
                      storageValue()?.tag === "loading" && "disabled"
                    }`}
                  >
                    <span class={`fa fa-repeat mr-2`}></span> Reload Value
                  </button>
                </td>
                <td>
                  <div>
                    <Show when={storageValue()?.tag === "loading"}>
                      <i class="fa fa-spinner animate-spin"></i> Loading...
                    </Show>
                    <Show when={storageValue()?.tag === "error"}>None</Show>
                    <Show when={storageValue()?.tag === "value"}>
                      Value:{" "}
                      <span class="text-orange-500">
                        {
                          (storageValue() as { tag: "value"; value: string })
                            .value
                        }
                      </span>
                    </Show>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Show>
      </div>
      <div class="mt-5">
        <CodeTabLayout
          staticCode={entry.code_example_static}
          dynamicCode={entry.code_example_dynamic}
        ></CodeTabLayout>
      </div>
    </>
  );
}
