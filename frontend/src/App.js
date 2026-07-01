import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth";
import { api } from "./lib/api";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingContactBar from "./components/FloatingContactBar";
import LoadingScreen from "./components/LoadingScreen";
import Home from "./pages/Home";
import Prices from "./pages/Prices";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Pickup from "./pages/Pickup";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

function Layout({ info, children }) {
  const { pathname } = useLocation();
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/login");
  return (
    <>
      {!isAdminArea && <Navbar />}
      {children}
      {!isAdminArea && <Footer info={info} />}
      {!isAdminArea && <FloatingContactBar info={info} />}
    </>
  );
}

function AppInner() {
  const [info, setInfo] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get("/business-info")
      .then((r) => setInfo(r.data))
      .catch(() => setInfo({}))
      .finally(() => {
        // hold the loader briefly for polish
        setTimeout(() => setReady(true), 500);
      });
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <Layout info={info}>
      <Routes>
        <Route path="/" element={<Home info={info} />} />
        <Route path="/prices" element={<Prices />} />
        <Route path="/services" element={<Services />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/pickup" element={<Pickup info={info} />} />
        <Route path="/contact" element={<Contact info={info} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppInner />
          <Toaster position="top-right" theme="dark" toastOptions={{
            style: { background: "#141A2E", color: "#fff", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 0 },
          }} />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
