import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Accueil from "./pages/Accueil";
import UserList from "./pages/UserList";
import PageStoryCreator from "./pages/PageStoryCreator";


export default function App() {
return (
<Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/acceuil" element={<Accueil />} />
<Route path="/users" element={<UserList />} />
<Route path="/story-creator" element={<PageStoryCreator />} />


</Routes>
);
}