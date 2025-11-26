import React, { useState } from "react";

type ChoiceDraft = {
  id: string;
  text: string;
  nextPageIndex: number | null;
};

type PageDraft = {
  id: string;
  content: string;
  isEnding: boolean;
  choices: ChoiceDraft[];
};

const genId = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export default function PageStoryCreator(): JSX.Element {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [content, setContent] = useState<string>("");
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [choices, setChoices] = useState<ChoiceDraft[]>([{ id: genId("c_"), text: "", nextPageIndex: null }]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetEditor = () => {
    setContent("");
    setIsEnding(false);
    setChoices([{ id: genId("c_"), text: "", nextPageIndex: null }]);
  };

  const addChoiceToEditor = () => {
    if (choices.length >= 2) return;
    setChoices([...choices, { id: genId("c_"), text: "", nextPageIndex: null }]);
  };

  const removeChoiceFromEditor = (id: string) => {
    setChoices((s) => s.filter((c) => c.id !== id));
  };

  const addPage = () => {
    setError(null);
    if (!content.trim()) {
      setError("Le contenu de la page ne peut pas être vide.");
      return;
    }
    const finalChoices = isEnding
      ? []
      : choices.filter((c) => c.text.trim().length > 0).slice(0, 2).map((c) => ({ ...c }));

    const newPage: PageDraft = {
      id: genId("p_"),
      content: content.trim(),
      isEnding,
      choices: finalChoices
    };
    setPages((p) => [...p, newPage]);
    resetEditor();
    setMessage("Page ajoutée.");
    setTimeout(() => setMessage(null), 1800);
  };

  const updateChoiceInPage = (pageIndex: number, choiceIndex: number, patch: Partial<ChoiceDraft>) => {
    setPages((p) => {
      const copy = [...p];
      const page = { ...copy[pageIndex] };
      const choicesCopy = [...page.choices];
      choicesCopy[choiceIndex] = { ...choicesCopy[choiceIndex], ...patch };
      page.choices = choicesCopy;
      copy[pageIndex] = page;
      return copy;
    });
  };

  const addChoiceToPage = (pageIndex: number) => {
    setPages((p) => {
      const copy = [...p];
      const page = { ...copy[pageIndex] };
      if (page.isEnding) return copy;
      if (!page.choices) page.choices = [];
      if (page.choices.length >= 2) return copy;
      page.choices = [...page.choices, { id: genId("c_"), text: "", nextPageIndex: null }];
      copy[pageIndex] = page;
      return copy;
    });
  };

  const deletePage = (index: number) => {
    setPages((p) => {
      const copy = [...p];
      copy.splice(index, 1);
      return copy;
    });
  };

  const movePage = (index: number, dir: -1 | 1) => {
    setPages((p) => {
      const copy = [...p];
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= copy.length) return copy;
      const [item] = copy.splice(index, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  const submitStory = async () => {
    setError(null);
    setMessage(null);
    if (!title.trim()) {
      setError("Titre requis.");
      return;
    }
    if (pages.length === 0) {
      setError("Ajoute au moins une page.");
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      pages: pages.map((pg) => ({
        content: pg.content,
        isEnding: pg.isEnding,
        choices: pg.isEnding ? [] : (pg.choices || []).slice(0, 2).map(c => ({
          text: c.text,
          nextPageIndex: typeof c.nextPageIndex === "number" ? c.nextPageIndex : null
        }))
      }))
    };
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Pas connecté (token manquant).");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/stories/createStoryWithPages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur serveur lors de la création.");
      } else {
        setMessage("Histoire créée avec id: " + (data.storyId ?? "—"));
        setTitle("");
        setDescription("");
        setPages([]);
        resetEditor();
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16 }}>
      <h1>Créer une histoire</h1>
      <input
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 8, fontSize: 16, marginBottom: 12 }}
      />
      <textarea
        placeholder="Description (optionnelle)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ width: "100%", padding: 8, minHeight: 64, marginBottom: 16 }}
      />
      <section style={{ border: "1px solid #333", padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <h2>Éditeur de page</h2>
        <textarea
          placeholder="Contenu de la page"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", minHeight: 100, padding: 8 }}
        />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={isEnding}
            onChange={(e) => {
              setIsEnding(e.target.checked);
              if (e.target.checked) setChoices([]);
              else if (choices.length === 0) setChoices([{ id: genId("c_"), text: "", nextPageIndex: null }]);
            }}
          />
          Page finale ?
        </label>
        {!isEnding && (
          <>
            <div style={{ marginTop: 8 }}><strong>Choix (max 2)</strong></div>
            {choices.map((c, idx) => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  style={{ flex: 1 }}
                  value={c.text}
                  placeholder={`Texte du choix ${idx + 1}`}
                  onChange={(e) => {
                    const copy = [...choices];
                    copy[idx] = { ...copy[idx], text: e.target.value };
                    setChoices(copy);
                  }}
                />
                <input
                  style={{ width: 120 }}
                  type="number"
                  placeholder={pages.length ? `next page (0..${pages.length})` : "index"}
                  value={c.nextPageIndex ?? ""}
                  onChange={(e) => {
                    const copy = [...choices];
                    const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                    copy[idx] = { ...copy[idx], nextPageIndex: isNaN(v as any) ? null : v };
                    setChoices(copy);
                  }}
                />
                {choices.length > 1 && (
                  <button type="button" onClick={() => removeChoiceFromEditor(c.id)} style={{ background: "#ff7675", border: "none", color: "#fff", padding: "6px 8px" }}>X</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addChoiceToEditor} disabled={choices.length >= 2} style={{ marginTop: 8 }}>Ajouter un choix</button>
          </>
        )}
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={addPage}>➕ Ajouter la page</button>
        </div>
      </section>
      <section style={{ marginBottom: 16 }}>
        <h2>Pages créées ({pages.length})</h2>
        {pages.length === 0 && <div style={{ color: "#888" }}>Aucune page pour l'instant</div>}
        {pages.map((p, i) => (
          <div key={p.id} style={{ border: "1px solid #222", padding: 12, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div><strong>Page {i}</strong> {p.isEnding && <span style={{ color: "#e11", marginLeft: 8 }}>FINALE</span>}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => movePage(i, -1)} disabled={i === 0}>↑</button>
                <button onClick={() => movePage(i, 1)} disabled={i === pages.length - 1}>↓</button>
                <button onClick={() => deletePage(i)} style={{ background: "#ff6b6b", color: "#fff" }}>Suppr</button>
              </div>
            </div>
            <p style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{p.content}</p>
            {!p.isEnding && (
              <>
                <div><strong>Choix :</strong>
                  {(!p.choices || p.choices.length === 0) && <div style={{ color: "#888" }}>Aucun choix</div>}
                  <ul>
                    {p.choices.map((c, ci) => (
                      <li key={c.id}>
                        <input value={c.text} onChange={(e) => updateChoiceInPage(i, ci, { text: e.target.value })} style={{ width: "60%" }} />
                        <input type="number" placeholder={`next (0..${Math.max(0, pages.length - 1)})`} value={c.nextPageIndex ?? ""} onChange={(e) => {
                          const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                          updateChoiceInPage(i, ci, { nextPageIndex: isNaN(v as any) ? null : v });
                        }} style={{ width: 80, marginLeft: 8 }} />
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => addChoiceToPage(i)} disabled={p.choices.length >= 2}>Ajouter un choix (page)</button>
              </>
            )}
          </div>
        ))}
      </section>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={submitStory} disabled={loading}>{loading ? "Création..." : "🚀 Créer l'histoire"}</button>
        <button onClick={() => { setPages([]); resetEditor(); setTitle(""); setDescription(""); setMessage(null); setError(null); }}>Réinitialiser</button>
      </div>
      {error && <div style={{ marginTop: 12, color: "#ff6b6b" }}>{error}</div>}
      {message && <div style={{ marginTop: 12, color: "#55efc4" }}>{message}</div>}
    </div>
  );
}
