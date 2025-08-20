/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
  Navigate,
} from "react-router-dom";
import NotFound from "./notfound";
import Home from "./pages/page";

const App = () => {

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
           <Route path="/"  element={<Home/>}  />
           <Route path="*" element={<NotFound/>} />
      </>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
