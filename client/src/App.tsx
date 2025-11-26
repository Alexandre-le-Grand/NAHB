import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Accueil from "./pages/Accueil";
import UserList from "./pages/UserList";
import PageStoryCreator from "./pages/PageStoryCreator";
import Library from "./pages/Library";
import ReadStory from "./pages/ReadStory";
import MyStory from "./pages/Mystory";
import Profile from "./pages/Profile";

export default function App() {
return (
<Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/acceuil" element={<Accueil />} />
<Route path="/users" element={<UserList />} />
<Route path="/story-creator" element={<PageStoryCreator />} />
<Route path="/story-creator/:storyId" element={<PageStoryCreator />} />
<Route path="/library" element={<Library />} />
<Route path="/play/:storyId" element={<ReadStory />} />
<Route path="/my-stories" element={<MyStory />} />
<Route path="/profile" element={<Profile />} />

</Routes>
);
}