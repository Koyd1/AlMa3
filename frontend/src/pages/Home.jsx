import { Button } from "@/components/ui/button.jsx";
import { Link } from "react-router-dom";
import { Sparkles, Zap, Users, BarChart3 } from "lucide-react";

const Home = () => {
  return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Orchestrator
            </span>
            </div>
            <nav className="hidden md:flex gap-4 lg:gap-6">
              <Link
                  to="/"
                  className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Главная
              </Link>
              <Link
                  to="/pricing"
                  className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Тарифы
              </Link>
              <Link
                  to="/dashboard"
                  className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Личный кабинет
              </Link>
            </nav>
            <Link to="/auth">
              <Button
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10"
              >
                Войти
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary-glow mb-4">
                Новое поколение маркетинга
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                AI-оркестратор для ваших{" "}
                <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                маркетинговых кампаний
              </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Автоматизируйте создание контента, управляйте агентами и
                получайте результаты с помощью передовых AI-технологий.
                Сохраняйте все артефакты в одном месте.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/50"
                  >
                    Начать работу
                  </Button>
                </Link>
              <Link to="/learn-more">
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
                  Узнать больше
                </Button>
              </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Возможности платформы
              </h2>
              <p className="text-muted-foreground text-lg">
                Всё необходимое для успешных маркетинговых кампаний
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  icon: Sparkles,
                  title: "AI-оркестрация",
                  description:
                      "Умное управление множеством AI-агентов для комплексных задач",
                },
                {
                  icon: Zap,
                  title: "Быстрая генерация",
                  description:
                      "Создавайте контент и отчёты за считанные минуты",
                },
                {
                  icon: Users,
                  title: "Командная работа",
                  description:
                      "Совместный доступ к проектам и артефактам",
                },
                {
                  icon: BarChart3,
                  title: "Аналитика",
                  description:
                      "Подробные отчёты и метрики эффективности кампаний",
                },
              ].map((feature, index) => (
                  <div
                      key={index}
                      className="group relative p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20"
                  >
                    <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Как это работает
              </h2>
              <p className="text-muted-foreground text-lg">
                Простой процесс от идеи до результата
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {[
                {
                  step: "01",
                  title: "Выберите тариф",
                  description:
                      "Подберите план, который соответствует вашим потребностям — от базового до профессионального",
                },
                {
                  step: "02",
                  title: "Настройте кампанию",
                  description:
                      "Задайте параметры, цели и целевую аудиторию для вашей маркетинговой кампании",
                },
                {
                  step: "03",
                  title: "Запустите AI-агентов",
                  description:
                      "Система автоматически оркестрирует работу агентов для создания контента и анализа",
                },
                {
                  step: "04",
                  title: "Получите результаты",
                  description:
                      "Скачайте готовые материалы, отчёты и артефакты — всё в одном месте",
                },
              ].map((item, index) => (
                  <div key={index} className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/50">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Готовы начать?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам маркетологов, которые уже используют
              AI-оркестратор
            </p>
            <Link to="/pricing">
              <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/50"
              >
                Посмотреть тарифы
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2025 AI Orchestrator AlMa3. Все права защищены.</p>
          </div>
        </footer>
      </div>
  );
};

export default Home;
