import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, MapPin, Award, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-civic.jpg";
import { useStatistics } from "@/contexts/StatisticsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoDemo from "@/components/VideoDemo";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { stats: appStats } = useStatistics();
  const { t } = useLanguage();
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };
  
  const stats = [
    { 
      number: formatNumber(appStats.issuesResolved), 
      label: t.hero.stats.issuesResolved, 
      icon: MessageSquare 
    },
    { 
      number: formatNumber(appStats.activeCitizens), 
      label: t.hero.stats.activeCitizens, 
      icon: Users 
    },
    { 
      number: `${appStats.responseRate || 0}%`, 
      label: t.hero.stats.responseRate, 
      icon: MapPin 
    },
    { 
      number: appStats.userRating > 0 ? `${appStats.userRating}★` : "N/A", 
      label: t.hero.stats.userRating, 
      icon: Award 
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-muted/30 to-primary/5 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6 animate-fade-in-up">
              <Badge variant="secondary" className="w-fit px-4 py-2">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {t.hero.badge}
                </span>
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {t.hero.title.part1}{" "}
                <span className="civic-gradient bg-clip-text text-transparent">
                  {t.hero.title.part2}
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={onGetStarted}
                  variant="civic" 
                  size="lg" 
                  className="text-lg px-8 py-6 shadow-civic"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {t.hero.reportButton}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <VideoDemo />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center animate-slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <stat.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">{stat.number}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-slide-in-right">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Citizens using civic reporting app to improve their community"
                  className="rounded-2xl shadow-strong w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl" />
              </div>
              
              {/* Floating Cards */}
              <Card className="absolute -top-4 -left-4 shadow-civic animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.hero.floatingCards.resolved.title}</p>
                      <p className="text-xs text-muted-foreground">{t.hero.floatingCards.resolved.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute -bottom-4 -right-4 shadow-civic animate-pulse" style={{ animationDelay: "1s" }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.hero.floatingCards.upvotes.title}</p>
                      <p className="text-xs text-muted-foreground">{t.hero.floatingCards.upvotes.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.hero.howItWorks.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.hero.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-soft hover:shadow-strong transition-civic">
              <CardContent className="p-6">
                <div className="w-16 h-16 civic-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.hero.howItWorks.step1.title}</h3>
                <p className="text-muted-foreground">
                  {t.hero.howItWorks.step1.description}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-soft hover:shadow-strong transition-civic">
              <CardContent className="p-6">
                <div className="w-16 h-16 success-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.hero.howItWorks.step2.title}</h3>
                <p className="text-muted-foreground">
                  {t.hero.howItWorks.step2.description}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-soft hover:shadow-strong transition-civic">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.hero.howItWorks.step3.title}</h3>
                <p className="text-muted-foreground">
                  {t.hero.howItWorks.step3.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;