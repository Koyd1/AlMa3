import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Sparkles,
  LogOut,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns.jsx";
import { useProfile } from "@/hooks/useProfile";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { profile } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Завершена";
      case "processing":
        return "В процессе";
      case "failed":
        return "Ошибка";
      default:
        return "Черновик";
    }
  };

  const getPlanBadge = (plan) => {
    const planColors = {
      free: "bg-muted text-muted-foreground",
      plus: "bg-accent/20 text-accent-foreground",
      pro: "bg-primary/20 text-primary-foreground",
    };
    return planColors[plan] || planColors.free;
  };

  const getPlanText = (plan) => {
    const planText = {
      free: "Обычный",
      plus: "Плюс",
      pro: "ПРО",
    };
    return planText[plan] || "Обычный";
  };

  if (authLoading || campaignsLoading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

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
            <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.email || user?.email}
            </span>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="border-primary/50 hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">Личный кабинет</h1>
              {profile && (
                  <Badge className={getPlanBadge(profile.subscription_plan)}>
                    {getPlanText(profile.subscription_plan)}
                  </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Управляйте своими кампаниями и просматривайте историю запросов
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-muted-foreground mb-2">Всего кампаний</div>
              <div className="text-3xl font-bold">{campaigns?.length || 0}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-muted-foreground mb-2">Активных</div>
              <div className="text-3xl font-bold text-green-500">
                {campaigns?.filter((c) => c.status === "processing").length || 0}
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-muted-foreground mb-2">Завершенных</div>
              <div className="text-3xl font-bold text-blue-500">
                {campaigns?.filter((c) => c.status === "completed").length || 0}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-6">
            <h2 className="text-2xl font-bold">Мои кампании</h2>
            <Link to="/campaign/new">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Новая кампания
              </Button>
            </Link>
          </div>

          {/* Campaigns List */}
          {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                    <div
                        key={campaign.id}
                        className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:justify-between">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(campaign.status)}
                            <h3 className="text-lg md:text-xl font-semibold">
                              {campaign.title}
                            </h3>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                            <span>Статус: {getStatusText(campaign.status)}</span>
                            <span>
                        Дата:{" "}
                              {new Date(campaign.created_at).toLocaleDateString("ru-RU")}
                      </span>
                            {campaign.selected_agents &&
                                campaign.selected_agents.length > 0 && (
                                    <span>Агентов: {campaign.selected_agents.length}</span>
                                )}
                          </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/50 hover:bg-primary/10 w-full sm:w-auto"
                        >
                          Подробнее
                        </Button>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <div className="text-muted-foreground mb-4">
                  У вас пока нет кампаний
                </div>
                <Link to="/campaign/new">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первую кампанию
                  </Button>
                </Link>
              </div>
          )}
        </div>
      </div>
  );
};

export default Dashboard;
