import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { search, type SearchResponse, splitArtists } from "api/api";
import SearchResults from "../SearchResults";
import type {
  MergeSearchCleanerFunc,
} from "~/routes/MediaItems/MediaLayout";
import { useNavigate } from "react-router";

interface Props {
  open: boolean;
  setOpen: Function;
  type: string;
  currentId: number;
  currentTitle: string;
  splitCleanerFunc: MergeSearchCleanerFunc;
}

export default function SplitModal(props: Props) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchResponse>();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [splitTargets, setSplitTargets] = useState<{ title: string; id: number }[]>([]);
  const [newArtists, setNewArtists] = useState<string[]>([""]);
  const [createMissing, setCreateMissing] = useState(true);
  const navigate = useNavigate();

  const closeSplitModal = () => {
    props.setOpen(false);
    setQuery("");
    setData(undefined);
    setSplitTargets([]);
    setNewArtists([""]);
    setCreateMissing(true);
  };

  const toggleSelect = ({ title, id }: { title: string; id: number }) => {
    const exists = splitTargets.find(target => target.id === id);
    if (exists) {
      setSplitTargets(splitTargets.filter(target => target.id !== id));
    } else {
      setSplitTargets([...splitTargets, { title, id }]);
    }
  };

  const addNewArtist = () => {
    setNewArtists([...newArtists, ""]);
  };

  const removeNewArtist = (index: number) => {
    const newArtistsCopy = [...newArtists];
    newArtistsCopy.splice(index, 1);
    setNewArtists(newArtistsCopy);
  };

  const updateNewArtist = (index: number, value: string) => {
    const newArtistsCopy = [...newArtists];
    newArtistsCopy[index] = value;
    setNewArtists(newArtistsCopy);
  };

  const doSplit = () => {
    const targetIds = splitTargets.map(target => target.id);
    const validNewArtists = newArtists.filter(name => name.trim() !== "");
    
    splitArtists(props.currentId, targetIds, createMissing, validNewArtists)
      .then((r: Response) => {
        if (r.ok) {
          window.location.reload();
        } else {
          // TODO: handle error
          console.log(r);
        }
      })
      .catch((err: any) => console.log(err));
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query === "") {
        setData(undefined);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery).then((r) => {
        r = props.splitCleanerFunc(r, props.currentId);
        setData(r);
      });
    }
  }, [debouncedQuery]);

  return (
    <Modal isOpen={props.open} onClose={closeSplitModal}>
      <h3>Split {props.type}</h3>
      <div className="flex flex-col items-center">
        <p className="text-sm text-(--color-fg-secondary) mb-4">
          Current: <strong>{props.currentTitle}</strong>
        </p>
        
        <div className="w-full mb-4">
          <h4 className="text-sm font-semibold mb-2">Existing Artists:</h4>
          <input
            type="text"
            placeholder={`Search for existing ${props.type.toLowerCase()}s to split into`}
            className="w-full mx-auto fg bg rounded p-2"
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchResults selectorMode data={data} onSelect={toggleSelect} />
        </div>

        <div className="w-full mb-4">
          <h4 className="text-sm font-semibold mb-2">New Artists:</h4>
          {newArtists.map((artistName, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder={`New ${props.type.toLowerCase()} name`}
                className="flex-1 p-2 border rounded"
                value={artistName}
                onChange={(e) => updateNewArtist(index, e.target.value)}
              />
              <button
                onClick={() => removeNewArtist(index)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={newArtists.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addNewArtist}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add New Artist
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            name="create-missing"
            checked={createMissing}
            onChange={() => setCreateMissing(!createMissing)}
          />
          <label htmlFor="create-missing">Create missing artists</label>
        </div>

        {splitTargets.length > 0 || newArtists.some(name => name.trim() !== "") ? (
          <div className="mt-4 p-3 bg-(--color-bg-secondary) rounded">
            <p className="font-semibold mb-2">Split Summary:</p>
            <p className="text-sm">
              <strong>{props.currentTitle}</strong> will be split into:
            </p>
            <ul className="list-disc list-inside mt-2">
              {splitTargets.map(target => (
                <li key={target.id}>{target.title}</li>
              ))}
              {newArtists.filter(name => name.trim() !== "").map((name, index) => (
                <li key={`new-${index}`}>{name} (new)</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          className="hover:cursor-pointer px-5 py-2 rounded-md mt-5 bg-(--color-bg) hover:bg-(--color-bg-tertiary)"
          onClick={doSplit}
          disabled={splitTargets.length === 0 && newArtists.every(name => name.trim() === "")}
        >
          Split Artists
        </button>
      </div>
    </Modal>
  );
}