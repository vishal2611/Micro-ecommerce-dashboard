import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TopBar from "../components/TopBar";
import DashboardPage from "./DashboardPage";
import ProfilePage from "./ProfilePage";
import ProductsPage from "./ProductsPage";
import CartPage from "./CartPage";
import OrdersPage from "./OrdersPage";
import PaymentsPage from "./PaymentsPage";

export default function DashboardShell() {
  const [active, setActive] = useState("overview");

  return (
    <div style={styles.shell}>
      <Sidebar active={active} onNavigate={setActive} />
      <div style={styles.content}>
        <Navbar />
        {active === "overview" && (
          <>
            <TopBar title="Overview" subtitle="Everything about your account, in one place." />
            <DashboardPage />
          </>
        )}
        {active === "profile" && <ProfilePage />}
        {active === "products" && <ProductsPage />}
        {active === "cart" && <CartPage />}
        {active === "orders" && <OrdersPage />}
        {active === "payments" && <PaymentsPage />}
      </div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" },
  content: { flex: 1, minWidth: 0 },
};