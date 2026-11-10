// Compila la APK firmada de la app (repartidor y vendedor).
// Uso: npm run apk  →  deja el archivo en apk/productos-jalil.apk
// Requiere JDK 21 (JAVA_HOME o C:\Program Files\Microsoft\jdk-21*) y el SDK de
// Android (ANDROID_HOME o %LOCALAPPDATA%\Android\Sdk).
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const esWindows = process.platform === "win32";

function buscarJdk() {
  if (process.env.JAVA_HOME && existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  const base = "C:\\Program Files\\Microsoft";
  if (esWindows && existsSync(base)) {
    const jdk = readdirSync(base).find((d) => d.startsWith("jdk-21"));
    if (jdk) return join(base, jdk);
  }
  throw new Error("No encontré el JDK 21. Instálalo (winget install Microsoft.OpenJDK.21) o define JAVA_HOME.");
}

function buscarSdk() {
  const candidato = process.env.ANDROID_HOME || (process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Android", "Sdk"));
  if (candidato && existsSync(candidato)) return candidato;
  throw new Error("No encontré el SDK de Android. Instala Android Studio o define ANDROID_HOME.");
}

const env = { ...process.env, JAVA_HOME: buscarJdk(), ANDROID_HOME: buscarSdk() };

// Java en Windows crea un socket local en la carpeta temporal y a veces falla
// ("Unable to establish loopback connection"); se le da una carpeta propia.
if (esWindows) {
  const carpetaSocket = join(process.env.USERPROFILE ?? ".", ".gradle", "tmp-socket");
  mkdirSync(carpetaSocket, { recursive: true });
  env.JAVA_TOOL_OPTIONS = `${env.JAVA_TOOL_OPTIONS ?? ""} -Djdk.net.unixdomain.tmpdir=${carpetaSocket}`.trim();
}
const correr = (comando, cwd = ".") => execSync(comando, { cwd, env, stdio: "inherit" });

if (!existsSync("android/keystore.properties")) {
  console.warn("Aviso: no hay android/keystore.properties; la APK saldrá sin firmar y no se podrá instalar.");
}

correr("npx cap sync android");
correr(esWindows ? ".\\gradlew.bat assembleRelease" : "./gradlew assembleRelease", "android");

const salida = "android/app/build/outputs/apk/release/app-release.apk";
if (!existsSync(salida)) throw new Error(`No se generó ${salida}`);
mkdirSync("apk", { recursive: true });
copyFileSync(salida, "apk/productos-jalil.apk");
console.log("\nAPK lista: apk/productos-jalil.apk");
