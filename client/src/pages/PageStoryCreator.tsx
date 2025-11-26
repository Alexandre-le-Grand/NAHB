import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type ChoiceDraft = {
  id: string;
  text: string;
  // we support either a numeric index or a client-side temp page id
  nextPageIndex: number | null;
  nextPageTempId?: string | null;
};

type PageDraft = {
  id: string;
  content: string;
  isEnding: boolean;
  choices: ChoiceDraft[];
};

const genId = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export default function PageStoryCreator(): JSX.Element {
  const { storyId } = useParams<{ storyId?: string }>();
  const navigate = useNavigate();
  const isEditing = !!storyId;
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [content, setContent] = useState<string>("");
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [choices, setChoices] = useState<ChoiceDraft[]>([{ id: genId("c_"), text: "", nextPageIndex: null }]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem("user");
    
    if (!token) {
        navigate('/login');
    } else if (userData) {
        setUser(JSON.parse(userData));
    }
  }, [navigate]);

  useEffect(() => {
    if (isEditing) {
      const fetchStoryForEdit = async () => {
        try {
          setLoading(true);
          const res = await fetch(`http://localhost:5000/stories/${storyId}/full`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          if (!res.ok) throw new Error("Impossible de charger l'histoire pour l'édition.");
          
          const storyData = await res.json();
          
          setTitle(storyData.title);
          setDescription(storyData.description);

          // Adapter les données des pages et choix pour l'éditeur
          const pagesForEditor = storyData.pages.map((p: any) => ({
            id: p.id.toString(), // Utiliser l'ID de la BDD comme ID temporaire
            content: p.content,
            isEnding: p.isEnding,
            choices: (p.choices || []).map((c: any) => ({
              id: c.id.toString(),
              text: c.text,
              nextPageIndex: null, // On utilisera nextPageTempId pour la cohérence
              nextPageTempId: c.next_PageId ? c.next_PageId.toString() : null
            }))
          }));
          setPages(pagesForEditor);

        } catch (err) {
          setError((err as Error).message);
        } finally {
          setLoading(false);
        }
      };
      fetchStoryForEdit();
    }
  }, [isEditing, storyId]);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
  };

  const resetEditor = () => {
    setContent("");
    setIsEnding(false);
    setChoices([{ id: genId("c_"), text: "", nextPageIndex: null }]);
  };

  const addChoiceToEditor = () => {
    if (choices.length >= 2) return;
    setChoices([...choices, { id: genId("c_"), text: "", nextPageIndex: null, nextPageTempId: null }]);
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
      page.choices = [...page.choices, { id: genId("c_"), text: "", nextPageIndex: null, nextPageTempId: null }];
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
      pages: pages.map((pg, index) => ({
        // include the client-side generated id so server can use it to resolve references
        id: pg.id,
        content: pg.content,
        isEnding: pg.isEnding,
        choices: pg.isEnding ? [] : (pg.choices || []).slice(0, 2).map(c => ({
          text: c.text,
          // prefer a chosen tempId reference so later edits or reorders don't break
          nextPageTempId: c.nextPageTempId,
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
      const url = isEditing ? `http://localhost:5000/stories/${storyId}/full` : "http://localhost:5000/stories/createStoryWithPages";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || `Erreur serveur lors de la ${isEditing ? 'mise à jour' : 'création'}.`);
      } else {
        setMessage(`Histoire ${isEditing ? 'mise à jour' : 'créée'} avec succès ! Redirection...`);
        // Redirige l'utilisateur vers la page de ses histoires après un court délai
        setTimeout(() => navigate('/my-stories'), 1500);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return <div style={styles.container}></div>;

  return (
    <div style={styles.container}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <nav style={styles.navbar}>
        <Link to="/acceuil" style={styles.logo}>
            <span style={{ fontSize: "24px", marginRight: "10px" }}>{isEditing ? '✏️' : '✍️'}</span> 
            Story Creator
        </Link>
        <div style={styles.navRight}>
            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                    <span style={styles.username}>{user.username}</span>
                </div>
            </Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>
                Déconnexion
            </button>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>{isEditing ? "Modifier l'histoire" : "Créer une nouvelle histoire"}</h1>
        
        <div style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Titre de l'histoire</label>
            <input
              placeholder="Le Château des Ombres"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Description (optionnelle)</label>
            <textarea
              placeholder="Une aventure sombre dans un château oublié..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{...styles.input, minHeight: 64}}
            />
          </div>
        </div>

        <section style={styles.card}>
          <h2 style={styles.cardHeader}>Éditeur de page</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contenu de la page</label>
            <textarea
              placeholder="Vous vous trouvez devant une immense porte en bois..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{...styles.input, minHeight: 100}}
            />
          </div>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isEnding}
              onChange={(e) => {
                setIsEnding(e.target.checked);
                if (e.target.checked) setChoices([]);
                else if (choices.length === 0) setChoices([{ id: genId("c_"), text: "", nextPageIndex: null }]);
              }}
            />
            Cette page est une fin
          </label>
          {!isEnding && (
            <div style={{marginTop: 16}}>
              <label style={styles.label}>Choix (max 2)</label>
              {choices.map((c, idx) => (
                <div key={c.id} style={styles.choiceEditorRow}>
                  <input
                    style={{...styles.input, flex: 1}}
                    value={c.text}
                    placeholder={`Texte du choix ${idx + 1}`}
                    onChange={(e) => {
                      const copy = [...choices];
                      copy[idx] = { ...copy[idx], text: e.target.value };
                      setChoices(copy);
                    }}
                  />
                  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                    <input
                      style={{...styles.input, width: 120}}
                      type="number"
                      placeholder={pages.length ? `Page (0..${pages.length})` : "Index"}
                      value={c.nextPageIndex ?? ""}
                      onChange={(e) => {
                        const copy = [...choices];
                        const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                        copy[idx] = { ...copy[idx], nextPageIndex: isNaN(v as any) ? null : v, nextPageTempId: null };
                        setChoices(copy);
                      }}
                    />

                    {pages.length > 0 && (
                      <select
                        value={c.nextPageTempId ?? ""}
                        onChange={(e) => {
                          const copy = [...choices];
                          copy[idx] = { ...copy[idx], nextPageTempId: e.target.value || null, nextPageIndex: null };
                          setChoices(copy);
                        }}
                        style={{...styles.input, width: 240}}
                      >
                        <option value="">— Cible existante (facultatif) —</option>
                        {pages.map((pg, pi) => (
                          <option key={pg.id} value={pg.id}>Page {pi} — {pg.content.slice(0, 30)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {choices.length > 1 && (
                    <button type="button" onClick={() => removeChoiceFromEditor(c.id)} style={styles.deleteBtnSmall}>X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addChoiceToEditor} disabled={choices.length >= 2} style={{...styles.button, ...styles.buttonSecondary, marginTop: 8}}>Ajouter un choix</button>
            </div>
          )}
          <div style={{ marginTop: 16, borderTop: '1px solid #334155', paddingTop: 16 }}>
            <button type="button" onClick={addPage} style={{...styles.button, ...styles.buttonPrimary}}>➕ Ajouter la page à l'histoire</button>
          </div>
        </section>

        <section>
          <h2 style={styles.pageTitle}>Pages créées ({pages.length})</h2>
          {pages.length === 0 && <div style={styles.emptyState}>Aucune page pour l'instant. Ajoutez-en une via l'éditeur ci-dessus.</div>}
          {pages.map((p, i) => (
            <div key={p.id} style={{...styles.card, marginBottom: 16}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', gap: 8 }}>
                <h3 style={styles.pageCardTitle}>
                  Page {i} {p.isEnding && <span style={styles.endingBadge}>FINALE</span>}
                </h3>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={styles.moveBtn} onClick={() => movePage(i, -1)} disabled={i === 0}>↑</button>
                  <button style={styles.moveBtn} onClick={() => movePage(i, 1)} disabled={i === pages.length - 1}>↓</button>
                  <button onClick={() => deletePage(i)} style={{...styles.button, ...styles.buttonDelete}}>Supprimer</button>
                </div>
              </div>
              <p style={styles.pageContent}>{p.content}</p>
              {!p.isEnding && (
                <div style={{marginTop: 16}}>
                  <label style={styles.label}>Choix :</label>
                  {(!p.choices || p.choices.length === 0) && <div style={{color: "#64748b", fontSize: 14, marginTop: 4}}>Aucun choix. Cette page est un cul-de-sac.</div>}
                  {p.choices.map((c, ci) => (
                    <div key={c.id} style={styles.choiceEditorRow}>
                      <input value={c.text} onChange={(e) => updateChoiceInPage(i, ci, { text: e.target.value })} style={{...styles.input, flex: 1}} />
                      <select
                        value={c.nextPageTempId ?? ""}
                        onChange={(e) => updateChoiceInPage(i, ci, { nextPageTempId: e.target.value || null, nextPageIndex: null })}
                        style={{...styles.input, width: 220}}
                      >
                        <option value="">-- Choisir une page cible --</option>
                        {pages.map((pg, idx) => (
                          <option key={pg.id} value={pg.id}>Page {idx} — {pg.content.slice(0, 40)}{pg.content.length > 40 ? '…' : ''}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button onClick={() => addChoiceToPage(i)} disabled={p.choices.length >= 2} style={{...styles.button, ...styles.buttonSecondary, marginTop: 8}}>Ajouter un choix</button>
                </div>
              )}
            </div>
          ))}
        </section>

        <div style={{...styles.card, marginTop: 24}}>
          {error && <div style={styles.errorBox}>{error}</div>}
          {message && <div style={styles.successBox}>{message}</div>}
          <div style={{ display: "flex", gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => { setPages([]); resetEditor(); setTitle(""); setDescription(""); setMessage(null); setError(null); }} style={{...styles.button, ...styles.buttonSecondary}}>Réinitialiser</button>
            <button onClick={submitStory} disabled={loading} style={{...styles.button, ...styles.buttonPrimary}}>{loading ? (isEditing ? "Mise à jour..." : "Création...") : (isEditing ? "Mettre à jour l'histoire" : "Créer l'histoire")}</button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: any = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden"
    },
    blob1: {
        position: "absolute",
        top: "-10%",
        left: "-10%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(40px)",
        zIndex: 0
    },
    blob2: {
        position: "absolute",
        bottom: "10%",
        right: "-5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(40px)",
        zIndex: 0
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        position: "sticky",
        top: 0,
        zIndex: 10
    },
    logo: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        letterSpacing: "-0.5px",
        textDecoration: 'none'
    },
    navRight: {
        display: "flex",
        alignItems: "center",
        gap: "20px"
    },
    userInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    avatar: {
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: "14px"
    },
    username: {
        fontWeight: "500",
        fontSize: "15px"
    },
    logoutBtn: {
        padding: "8px 16px",
        backgroundColor: "transparent",
        color: "#94a3b8",
        border: "1px solid #334155",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        transition: "all 0.2s"
    },
    main: {
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    pageTitle: {
        fontSize: "32px",
        fontWeight: "800",
        color: "white",
        textAlign: 'center',
        marginBottom: '16px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    card: {
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        borderRadius: "16px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)"
    },
    cardHeader: {
        fontSize: "20px",
        fontWeight: "700",
        marginBottom: "20px",
        color: "white",
        borderBottom: "1px solid #334155",
        paddingBottom: "15px"
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#94a3b8"
    },
    input: {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "8px",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        color: "#e2e8f0",
        fontSize: "15px"
    },
    checkboxLabel: {
      display: "inline-flex", 
      alignItems: "center", 
      gap: 8, 
      marginTop: 16,
      color: '#cbd5e1',
      fontSize: 14,
      cursor: 'pointer'
    },
    choiceEditorRow: {
      display: "flex", 
      gap: 8, 
      marginTop: 8,
      alignItems: 'center'
    },
    deleteBtnSmall: {
      background: "#ef4444", 
      border: "none", 
      color: "#fff", 
      borderRadius: '6px',
      width: '38px',
      height: '38px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    button: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: 'all 0.2s'
    },
    buttonPrimary: {
      background: "linear-gradient(to right, #38bdf8, #818cf8)",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#334155",
      color: "#cbd5e1",
      border: "1px solid #475569"
    },
    buttonDelete: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#fca5a5',
      padding: '6px 12px',
      fontSize: '13px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: "#64748b",
      backgroundColor: "rgba(30, 41, 59, 0.4)",
      borderRadius: '12px',
      border: '1px dashed #334155'
    },
    pageCardTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "white",
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    endingBadge: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#fca5a5',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      border: '1px solid #ef4444'
    },
    moveBtn: {
      backgroundColor: '#334155',
      color: '#94a3b8',
      border: 'none',
      borderRadius: '4px',
      width: '24px',
      height: '24px',
      cursor: 'pointer'
    },
    pageContent: {
      whiteSpace: "pre-wrap", 
      marginTop: 12, 
      padding: '12px',
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      border: '1px solid #334155',
      color: '#cbd5e1',
      fontSize: 14
    },
    errorBox: {
        padding: '1rem', 
        background: 'rgba(239, 68, 68, 0.2)', 
        border: '1px solid rgba(239, 68, 68, 0.5)', 
        borderRadius: '12px', 
        color: '#fca5a5', 
        marginBottom: '1rem',
        textAlign: 'center',
        fontSize: '14px'
    },
    successBox: {
        padding: '1rem', 
        background: 'rgba(34, 197, 94, 0.2)', 
        border: '1px solid rgba(34, 197, 94, 0.5)', 
        borderRadius: '12px', 
        color: '#86efac', 
        marginBottom: '1rem',
        textAlign: 'center',
        fontSize: '14px'
    },
};
