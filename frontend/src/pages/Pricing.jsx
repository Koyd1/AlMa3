import { Button } from "@/components/ui/button.jsx";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Обычный",
      price: "2,990₽",
      period: "в месяц",
      description: "Идеально для старта и небольших проектов",
      features: [
        "Базовая оркестрация агентов",
        "Генерация отчётов",
        "Скачивание артефактов",
        "До 10 кампаний в месяц",
        "Email поддержка",
        "Хранилище 5 ГБ",
      ],
      highlighted: false,
    },
    {
      name: "Плюс",
      price: "7,990₽",
      period: "в месяц",
      description: "Для активных маркетологов и команд",
      features: [
        "Всё из плана Обычный",
        "Расширенная оркестрация",
        "Несколько одновременных кампаний",
        "До 50 кампаний в месяц",
        "Дополнительные отчёты и аналитика",
        "Приоритетная поддержка",
        "Хранилище 50 ГБ",
        "API доступ",
      ],
      highlighted: true,
    },
    {
      name: "ПРО",
      price: "19,990₽",
      period: "в месяц",
      description: "Максимум возможностей для профессионалов",
      features: [
        "Всё из плана Плюс",
        "Неограниченное количество кампаний",
        "Приоритетная обработка",
        "Расширенная аналитика и insights",
        "Персональный менеджер",
        "SLA 99.9%",
        "Хранилище 500 ГБ",
        "Кастомизация AI-агентов",
      ],
      highlighted: false,
    },
  ];

  return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Orchestrator
            </span>
            </Link>
            <nav className="hidden md:flex gap-4 lg:gap-6">
              <Link
                  to="/"
                  className="text-foreground/80 hover:text-foreground transition-colors"
              >
                Главная
              </Link>
              <Link
                  to="/pricing"
                  className="text-foreground transition-colors"
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

        {/* Pricing Hero */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary-glow mb-4">
                Гибкие тарифы
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Выберите план для{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                вашего бизнеса
              </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Все планы включают базовые функции AI-оркестрации. Выберите тот,
                который подходит именно вам.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {plans.map((plan, index) => (
                  <div
                      key={index}
                      className={`relative rounded-2xl p-8 ${
                          plan.highlighted
                              ? "bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary shadow-lg shadow-primary/30"
                              : "bg-card border border-border"
                      } transition-all hover:scale-105`}
                  >
                    {plan.highlighted && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-sm font-medium">
                          Популярный
                        </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {plan.description}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                      </div>
                    </div>

                    <Link to="/auth" className="block mb-6">
                      <Button
                          className={`w-full ${
                              plan.highlighted
                                  ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                  : "bg-primary/10 hover:bg-primary/20 text-foreground"
                          }`}
                          size="lg"
                      >
                        Выбрать план
                      </Button>
                    </Link>

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                          <li
                              key={featureIndex}
                              className="flex items-start gap-3"
                          >
                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                      ))}
                    </ul>
                  </div>
              ))}
            </div>

            {/* FAQ or Additional Info */}
            <div className="mt-20 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Нужна помощь в выборе?
              </h2>
              <p className="text-muted-foreground mb-6">
                Свяжитесь с нами, и мы поможем подобрать оптимальный план
              </p>
              <Button
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10"
              >
                Связаться с нами
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2025 AI Orchestrator. Все права защищены.</p>
          </div>
        </footer>
      </div>
  );
};

export default Pricing;
