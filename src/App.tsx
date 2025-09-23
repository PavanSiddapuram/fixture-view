import { useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Login from "./pages/Login";
import AppShell, { AppShellHandle } from "./layout/AppShell";
import FileImport from "./modules/FileImport";
import { ProcessedFile } from "./modules/FileImport/types";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentFile, setCurrentFile] = useState<ProcessedFile | null>(null);
  const appShellRef = useRef<AppShellHandle>(null);

  const handleLogin = (credentials: { username: string; password: string }) => {
    // In a real app, you would validate credentials with a backend
    console.log('Login with:', credentials);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentFile(null);
  };

  const handleFileLoaded = (fileData: ProcessedFile) => {
    setCurrentFile(fileData);
  };

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Login onLogin={handleLogin} />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppShell
            ref={appShellRef}
            onLogout={handleLogout}
            isProcessing={false}
            fileStats={currentFile ? {
              name: currentFile.metadata.name,
              triangles: currentFile.metadata.triangles,
              size: `${(currentFile.metadata.size / 1024 / 1024).toFixed(2)} MB`
            } : undefined}
          >
            <FileImport onFileLoaded={handleFileLoaded} />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
