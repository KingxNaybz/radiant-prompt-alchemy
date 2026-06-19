import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Studio from "./pages/Studio.tsx";
import StudioOrders from "./pages/StudioOrders.tsx";
import StudioPayments from "./pages/StudioPayments.tsx";
import Commission from "./pages/Commission.tsx";
import Piece from "./pages/Piece.tsx";
import Buy from "./pages/Buy.tsx";
import OrderSuccess from "./pages/OrderSuccess.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Returns from "./pages/Returns.tsx";
import Privacy from "./pages/Privacy.tsx";
import Shipping from "./pages/Shipping.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/orders" element={<StudioOrders />} />
          <Route path="/commission" element={<Commission />} />
          <Route path="/piece/:id" element={<Piece />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/shipping" element={<Shipping />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
