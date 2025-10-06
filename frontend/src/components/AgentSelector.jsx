import { Brain, Search, Lightbulb, PenTool, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

const AgentSelector = ({ selectedAgents, onSelectionChange }) => {
  const agents = [
    {
      id: "analyst_icp",
      name: "Analyst (ICP)",
      icon: Search,
      description: "Исследует рынок и формирует целевую аудиторию",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "ideator_concepts",
      name: "Creative Strategist",
      icon: Lightbulb,
      description: "Формирует концепции и коммуникационные идеи",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "finance_assessment",
      name: "Finance",
      icon: BarChart,
      description: "Оценивает бюджеты и финансовые риски",
      color: "from-orange-500 to-amber-500",
    },
    {
      id: "technician_blueprint",
      name: "Technician",
      icon: Brain,
      description: "Проектирует техстек и дорожную карту реализации",
      color: "from-red-500 to-rose-500",
    },
    {
      id: "copywriter_texts",
      name: "Copywriter",
      icon: PenTool,
      description: "Создает тексты и рекламные материалы",
      color: "from-green-500 to-emerald-500",
    },
  ];

  const toggleAgent = (agentId) => {
    if (selectedAgents.includes(agentId)) {
      onSelectionChange(selectedAgents.filter((id) => id !== agentId));
    } else {
      onSelectionChange([...selectedAgents, agentId]);
    }
  };

  return (
      <div className="space-y-4">
        {/* Горизонтальный скролл на мобильных */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 md:gap-4 min-w-max md:min-w-0 md:grid md:grid-cols-5">
            {agents.map((agent) => {
              const isSelected = selectedAgents.includes(agent.id);
              const Icon = agent.icon;

              return (
                  <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={cn(
                          "group relative flex flex-col items-center p-4 rounded-lg border-2 transition-all w-[140px] md:w-auto",
                          "hover:scale-105 active:scale-95",
                          isSelected
                              ? "border-primary bg-primary/10 shadow-lg shadow-primary/30"
                              : "border-border bg-card hover:border-primary/50"
                      )}
                  >
                    <div
                        className={cn(
                            "mb-3 p-3 rounded-full transition-all",
                            isSelected
                                ? `bg-gradient-to-br ${agent.color} shadow-lg`
                                : "bg-muted group-hover:bg-muted/80"
                        )}
                    >
                      <Icon
                          className={cn(
                              "h-6 w-6",
                              isSelected ? "text-white" : "text-foreground"
                          )}
                      />
                    </div>

                    <div className="text-center">
                      <h4
                          className={cn(
                              "font-semibold text-sm mb-1",
                              isSelected ? "text-primary" : "text-foreground"
                          )}
                      >
                        {agent.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {agent.description}
                      </p>
                    </div>

                    {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                          <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                          >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                        </div>
                    )}
                  </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span>
          Выбрано: {selectedAgents.length} из {agents.length}
        </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>
  );
};

export default AgentSelector;
