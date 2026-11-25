// Testlerde "react" importunu test/react/fake-react.mjs dosyasına yönlendirir.
import { register } from "node:module";

register("./hooks.mjs", import.meta.url);
