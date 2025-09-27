import { useState } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import ReportForm from "@/components/ReportForm";
import CommunityFeed from "@/components/CommunityFeed";
import MyReports from "@/components/MyReports";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import Footer from "@/components/Footer";
import { useViewFromUrl } from "@/hooks/useViewFromUrl";

const Index = () => {
  const [activeView, setActiveView] = useState("home");

  // Use the hook to handle view changes from URL
  useViewFromUrl(setActiveView);

  const handleGetStarted = () => {
    setActiveView("report");
  };

  const renderContent = () => {
    switch (activeView) {
      case "report":
        return <ReportForm />;
      case "community":
        return <CommunityFeed />;
      case "my-reports":
        return <MyReports />;
      case "qr-generator":
        return <QRCodeGenerator />;
      default:
        return <HeroSection onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
