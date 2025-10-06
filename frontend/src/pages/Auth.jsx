import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState(null);
  const navigate = useNavigate();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        setInfoMessage(null);
      } else {
        const result = await signUpWithEmail(email, password);
        if (result?.requiresEmailConfirmation) {
          setInfoMessage(
            "Мы отправили письмо с подтверждением. Перейдите по ссылке, чтобы завершить регистрацию."
          );
        } else {
          setInfoMessage(null);
        }
      }
    } catch (error) {
      // Обработка ошибок выполняется в хуке
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      setInfoMessage(null);
    } catch (error) {
      // Обработка ошибок выполняется в хуке
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setInfoMessage(null);
  };

  return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 justify-center mb-8">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Orchestrator
          </span>
          </Link>

          {/* Карточка авторизации */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {isLogin ? "С возвращением" : "Создать аккаунт"}
              </h1>
              <p className="text-muted-foreground">
                {isLogin
                    ? "Войдите в свой аккаунт"
                    : "Начните использовать AI Orchestrator"}
              </p>
            </div>

            {infoMessage && (
              <Alert className="mb-6">
                <AlertTitle>Проверьте почту</AlertTitle>
                <AlertDescription>{infoMessage}</AlertDescription>
              </Alert>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-4 mb-6"
                autoComplete="on"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="bg-background"
                />
              </div>

              <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={loading}
              >
                {loading ? "Загрузка..." : isLogin ? "Войти" : "Зарегистрироваться"}
              </Button>
            </form>

            <div className="relative mb-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              ИЛИ
            </span>
            </div>

            <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full mb-4"
                disabled={loading}
                type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Войти через Google
            </Button>

            <div className="text-center">
              <button
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin
                    ? "Нет аккаунта? Зарегистрируйтесь"
                    : "Уже есть аккаунт? Войдите"}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
  );
};

export default Auth;
