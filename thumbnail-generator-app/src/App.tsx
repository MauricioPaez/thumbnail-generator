import "./App.css";
import Header from "./components/Header";
import UploadImage from "./components/UploadImage";

function App() {
  return (
    <div className="w-full">
      <Header title="Thumbnail Generator" />
      <UploadImage />
    </div>
  );
}

export default App;
