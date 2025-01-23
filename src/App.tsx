import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Edit } from "./components/edit/Edit";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { AuthGuard } from "./components/shared/AuthGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AuthGuard />}>
          <Route path="/home" element={<Home />} />
          <Route path="/edit" element={<Edit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
