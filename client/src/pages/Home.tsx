import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import React, { useState } from "react";

export default function Home() {
  const [hoverConnexion, setHoverConnexion] = useState(false);
  const [hoverInscription, setHoverInscription] = useState(false);

  const btnConnexionStyle = {
    ...styles.button,
    ...styles.buttonPrimary,
    transform: hoverConnexion ? "scale(1.05)" : "scale(1)",
    boxShadow: hoverConnexion ? "0 10px 25px -5px rgba(251, 191, 36, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  };

  const btnInscriptionStyle = {
    ...styles.button,
    ...styles.buttonSecondary,
    transform: hoverInscription ? "scale(1.05)" : "scale(1)",
    boxShadow: hoverInscription ? "0 10px 25px -5px rgba(139, 92, 246, 0.3)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND DECORATION */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        style={styles.logoContainer}
      >
        <div style={styles.logo}>
          <span style={styles.logoText}>NAHB</span>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={styles.title}
      >
        Bienvenue sur NAHB
      </motion.h1>

      {/* Boutons */}
      <div style={styles.buttonContainer}>
        <Link to="/login">
          <button
            style={btnConnexionStyle}
            onMouseEnter={() => setHoverConnexion(true)}
            onMouseLeave={() => setHoverConnexion(false)}
          >
            Connexion
          </button>
        </Link>

        <Link to="/register">
          <button
            style={btnInscriptionStyle}
            onMouseEnter={() => setHoverInscription(true)}
            onMouseLeave={() => setHoverInscription(false)}
          >
            Inscription
          </button>
        </Link>
      </div>
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
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    zIndex: 1,
  },
  blob1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(40px)",
    zIndex: -1,
  },
  blob2: {
    position: "absolute",
    bottom: "10%",
    right: "-5%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
    filter: "blur(40px)",
    zIndex: -1,
  },
  logoContainer: {
    marginBottom: "48px",
  },
  logo: {
    width: "144px",
    height: "144px",
    backgroundColor: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  logoText: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#8b5cf6", // purple-500
  },
  title: {
    fontSize: "clamp(2.5rem, 10vw, 3.75rem)", // Responsive font size
    fontWeight: "800",
    color: "white",
    marginBottom: "64px",
    textAlign: "center",
    textShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
    maxWidth: "384px",
  },
  button: {
    width: "100%",
    padding: "16px 0",
    borderRadius: "9999px",
    fontSize: "18px",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
  },
  buttonPrimary: {
    background: "linear-gradient(to right, #facc15, #f97316)", // yellow-400 to orange-500
    color: "white",
  },
  buttonSecondary: {
    background: "linear-gradient(to right, #facc15, #f97316)", // yellow-400 to orange-500
    color: "white",
  },
};
