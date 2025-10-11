import { Button } from "@/components/ui/button.jsx";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Brain,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const LearnMore = () => {
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
          <Link to="/">
            <Button
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              О платформе{" "}
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                AI Orchestrator
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Революционная платформа для управления маркетинговыми кампаниями с
              помощью искусственного интеллекта
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* What is AI Orchestrator */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">
                Что такое AI Orchestrator?
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                AI Orchestrator — это инновационная платформа, которая
                объединяет несколько специализированных AI-агентов для создания
                комплексных маркетинговых кампаний. Вместо того чтобы работать с
                одним AI-помощником, вы получаете целую команду экспертов,
                каждый из которых специализируется на своей области.
              </p>
              <p className="text-lg text-muted-foreground">
                Платформа автоматически координирует работу агентов, обеспечивая
                согласованность и высокое качество всех создаваемых материалов.
              </p>
            </div>

            {/* Key Technologies */}
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">
                Ключевые технологии
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                    <Brain className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Мультиагентная система
                  </h3>
                  <p className="text-muted-foreground">
                    Несколько специализированных AI-агентов работают
                    параллельно, обмениваясь информацией и создавая синергию для
                    достижения лучших результатов.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Умная оркестрация
                  </h3>
                  <p className="text-muted-foreground">
                    Центральный оркестратор анализирует задачу, распределяет
                    работу между агентами и собирает результаты в единое целое.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Безопасное хранение
                  </h3>
                  <p className="text-muted-foreground">
                    Все артефакты, материалы и результаты работы хранятся в
                    защищённом облачном хранилище с возможностью
                    версионирования.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Интеграции</h3>
                  <p className="text-muted-foreground">
                    Подключение к популярным маркетинговым платформам и
                    инструментам для автоматической публикации и аналитики.
                  </p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-6">Примеры использования</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Создание контент-кампании
                  </h3>
                  <p className="text-muted-foreground">
                    Загрузите бриф или опишите голосом вашу идею. Агенты создадут
                    тексты для соцсетей, email-рассылок, лендингов, подберут
                    изображения и разработают стратегию публикаций.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Анализ конкурентов
                  </h3>
                  <p className="text-muted-foreground">
                    Укажите конкурентов и получите детальный анализ их стратегий,
                    сильных и слабых сторон, а также рекомендации по
                    позиционированию вашего продукта.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Генерация креативов
                  </h3>
                  <p className="text-muted-foreground">
                    Опишите целевую аудиторию и цели кампании. Агенты создадут
                    несколько вариантов креативов с текстами и визуальными
                    концепциями для тестирования.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">Готовы попробовать?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Начните создавать маркетинговые кампании с AI уже сегодня
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/pricing">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/50"
                  >
                    Посмотреть тарифы
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    Войти в аккаунт
                  </Button>
                </Link>
              </div>
            </div>
          </div>
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

export default LearnMore;
