import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
  Sparkles,
  LogOut,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreVertical,
  Trash2,
  RefreshCw,
  Edit2,
  Pin,
  PinOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns.jsx";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    campaigns,
    isLoading: campaignsLoading,
    updateCampaign,
    deleteCampaign,
    refetch,
    isDeleting,
  } = useCampaigns();
  const { profile } = useProfile();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // ⚡ Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("campaigns-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // 🧩 UI helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
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
      case "pending":
        return "В ожидании";
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

  // 🧠 Handlers
  const handleDeleteClick = (campaign) => {
    setSelectedCampaign(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return;

    try {
      await deleteCampaign(selectedCampaign.id);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCampaign(null);
    }
  };

  const handleRenameClick = (campaign) => {
    setSelectedCampaign(campaign);
    setNewTitle(campaign.title);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = () => {
    if (selectedCampaign && newTitle.trim()) {
      updateCampaign({
        id: selectedCampaign.id,
        updates: { title: newTitle.trim() },
      });
      setRenameDialogOpen(false);
      setSelectedCampaign(null);
      setNewTitle("");
    }
  };

  const handleTogglePin = (campaign) => {
    updateCampaign({
      id: campaign.id,
      updates: { pinned: !campaign.pinned },
    });
  };

  const handleRegenerate = (campaign) => {
    navigate(`/campaign/${campaign.id}?mode=regenerate`);
  };

  // 🌀 Loading state
  if (authLoading || campaignsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 🧩 Render
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
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
            Управляйте своими кампаниями и отслеживайте их выполнение
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-muted-foreground mb-2">Всего кампаний</div>
            <div className="text-3xl font-bold">{campaigns?.length || 0}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-muted-foreground mb-2">Активных</div>
            <div className="text-3xl font-bold text-yellow-500">
              {campaigns?.filter((c) => c.status === "processing").length || 0}
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-muted-foreground mb-2">Завершённых</div>
            <div className="text-3xl font-bold text-green-500">
              {campaigns?.filter((c) => c.status === "completed").length || 0}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-2xl font-semibold">Мои кампании</h2>
          <Button
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto"
            onClick={() => navigate("/campaign/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Создать кампанию
          </Button>
        </div>

        {/* Campaigns List */}
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/campaign/${campaign.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/campaign/${campaign.id}`);
                  }
                }}
                className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:justify-between">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(campaign.status)}
                      <h3 className="text-lg md:text-xl font-semibold">
                        {campaign.title}
                      </h3>
                      {campaign.pinned && (
                        <Pin className="h-4 w-4 text-primary fill-primary" />
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                      <span>Статус: {getStatusText(campaign.status)}</span>
                      <span>
                        Дата:{" "}
                        {new Date(campaign.created_at).toLocaleDateString(
                          "ru-RU"
                        )}
                      </span>
                      {campaign.selected_agents?.length > 0 && (
                        <span>Агентов: {campaign.selected_agents.length}</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleTogglePin(campaign);
                        }}
                      >
                        {campaign.pinned ? (
                          <>
                            <PinOff className="h-4 w-4 mr-2" />
                            Открепить
                          </>
                        ) : (
                          <>
                            <Pin className="h-4 w-4 mr-2" />
                            Закрепить
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRenameClick(campaign);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Переименовать
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRegenerate(campaign);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Перегенерировать
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteClick(campaign);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить кампанию?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить кампанию "
              {selectedCampaign?.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать кампанию</DialogTitle>
            <DialogDescription>
              Введите новое название для кампании
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название кампании"
            onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!newTitle.trim()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;



//Old code
// import { useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { Button } from "@/components/ui/button.jsx";
// import { Badge } from "@/components/ui/badge.jsx";
// import {
//   Sparkles,
//   LogOut,
//   Plus,
//   Clock,
//   CheckCircle2,
//   AlertCircle,
//   Loader2,
// } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";
// import { useCampaigns } from "@/hooks/useCampaigns.jsx";
// import { useProfile } from "@/hooks/useProfile";
// import { supabase } from "@/integrations/supabase/client";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const { user, loading: authLoading, signOut } = useAuth();
//   const { campaigns, isLoading: campaignsLoading, refetch } = useCampaigns();
//   const { profile } = useProfile();

//   // 🔐 Redirect if not logged in
//   useEffect(() => {
//     if (!authLoading && !user) {
//       navigate("/auth");
//     }
//   }, [user, authLoading, navigate]);

//   // ⚡ Subscribe to Supabase realtime updates
//   useEffect(() => {
//     const channel = supabase
//       .channel("campaigns-updates")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "campaigns" },
//         () => {
//           refetch(); // обновляем кампании при любом изменении
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [refetch]);

//   // 🧩 UI helpers
//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "completed":
//         return <CheckCircle2 className="h-5 w-5 text-green-500" />;
//       case "processing":
//         return <Clock className="h-5 w-5 text-yellow-500" />;
//       case "failed":
//         return <AlertCircle className="h-5 w-5 text-red-500" />;
//       case "pending":
//         return <Clock className="h-5 w-5 text-muted-foreground" />;
//       default:
//         return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case "completed":
//         return "Завершена";
//       case "processing":
//         return "В процессе";
//       case "failed":
//         return "Ошибка";
//       case "pending":
//         return "В ожидании";
//       default:
//         return "Черновик";
//     }
//   };

//   const getPlanBadge = (plan) => {
//     const planColors = {
//       free: "bg-muted text-muted-foreground",
//       plus: "bg-accent/20 text-accent-foreground",
//       pro: "bg-primary/20 text-primary-foreground",
//     };
//     return planColors[plan] || planColors.free;
//   };

//   const getPlanText = (plan) => {
//     const planText = {
//       free: "Обычный",
//       plus: "Плюс",
//       pro: "ПРО",
//     };
//     return planText[plan] || "Обычный";
//   };

//   // 🌀 Loading state
//   if (authLoading || campaignsLoading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   // 🧠 Render
//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="border-b border-border backdrop-blur-sm sticky top-0 z-50 bg-background/80">
//         <div className="container mx-auto px-4 py-4 flex justify-between items-center">
//           <Link to="/" className="flex items-center gap-2">
//             <Sparkles className="h-6 w-6 text-primary" />
//             <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
//               AI Orchestrator
//             </span>
//           </Link>
//           <div className="flex items-center gap-4">
//             <span className="text-sm text-muted-foreground hidden sm:inline">
//               {profile?.email || user?.email}
//             </span>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={signOut}
//               className="border-primary/50 hover:bg-primary/10"
//             >
//               <LogOut className="h-4 w-4 mr-2" />
//               Выйти
//             </Button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8">
//         {/* Welcome Section */}
//         <div className="mb-8">
//           <div className="flex items-center gap-3 mb-2">
//             <h1 className="text-3xl md:text-4xl font-bold">Личный кабинет</h1>
//             {profile && (
//               <Badge className={getPlanBadge(profile.subscription_plan)}>
//                 {getPlanText(profile.subscription_plan)}
//               </Badge>
//             )}
//           </div>
//           <p className="text-muted-foreground">
//             Управляйте своими кампаниями и отслеживайте статус выполнения
//           </p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
//           <div className="bg-card border border-border rounded-lg p-6">
//             <div className="text-muted-foreground mb-2">Всего кампаний</div>
//             <div className="text-3xl font-bold">{campaigns?.length || 0}</div>
//           </div>
//           <div className="bg-card border border-border rounded-lg p-6">
//             <div className="text-muted-foreground mb-2">Активных</div>
//             <div className="text-3xl font-bold text-yellow-500">
//               {campaigns?.filter((c) => c.status === "processing").length || 0}
//             </div>
//           </div>
//           <div className="bg-card border border-border rounded-lg p-6">
//             <div className="text-muted-foreground mb-2">Завершённых</div>
//             <div className="text-3xl font-bold text-green-500">
//               {campaigns?.filter((c) => c.status === "completed").length || 0}
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-6">
//           <h2 className="text-2xl font-bold">Мои кампании</h2>
//           <Link to="/campaign/new">
//             <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 w-full sm:w-auto">
//               <Plus className="h-4 w-4 mr-2" />
//               Новая кампания
//             </Button>
//           </Link>
//         </div>

//         {/* Campaigns List */}
//         {campaigns && campaigns.length > 0 ? (
//           <div className="space-y-4">
//             {campaigns.map((campaign) => (
//               <div
//                 key={campaign.id}
//                 className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 transition-colors"
//               >
//                 <div className="flex flex-col sm:flex-row items-start gap-4 sm:justify-between">
//                   <div className="flex-1 w-full">
//                     <div className="flex items-center gap-3 mb-2">
//                       {getStatusIcon(campaign.status)}
//                       <h3 className="text-lg md:text-xl font-semibold">
//                         {campaign.title}
//                       </h3>
//                     </div>
//                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
//                       <span>Статус: {getStatusText(campaign.status)}</span>
//                       <span>
//                         Дата:{" "}
//                         {new Date(campaign.created_at).toLocaleDateString("ru-RU")}
//                       </span>
//                       {campaign.selected_agents &&
//                         campaign.selected_agents.length > 0 && (
//                           <span>Агентов: {campaign.selected_agents.length}</span>
//                         )}
//                     </div>
//                   </div>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     className="border-primary/50 hover:bg-primary/10 w-full sm:w-auto"
//                     onClick={() => navigate(`/campaign/${campaign.id}`)}
//                   >
//                     Подробнее
//                   </Button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12 bg-card border border-border rounded-lg">
//             <div className="text-muted-foreground mb-4">
//               У вас пока нет кампаний
//             </div>
//             <Link to="/campaign/new">
//               <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Создать первую кампанию
//               </Button>
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
