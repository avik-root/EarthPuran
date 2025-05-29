
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, CreditCard, Users, Activity } from "lucide-react";
import { getProducts } from "@/app/actions/productActions";
import { getAllUsers } from "@/app/actions/userActions";
import type { UserData } from "@/types/userData";
import type { Order } from "@/types/order";

async function getDashboardData() {
  const products = await getProducts();
  const allUsersData: UserData[] = await getAllUsers();

  let totalRevenue = 0;
  let pendingOrdersCount = 0;
  let allOrders: Order[] = [];

  allUsersData.forEach(user => {
    if (user.orders) {
      allOrders = allOrders.concat(user.orders);
      user.orders.forEach(order => {
        if (order.status === 'Delivered') {
          totalRevenue += order.totalAmount;
        }
        if (order.status === 'Processing') {
          pendingOrdersCount++;
        }
      });
    }
  });

  const totalProducts = products.length;
  const totalCustomers = allUsersData.length;

  // For recent activity, we'll keep placeholders for now
  // or could show last N orders or users.
  // Example: Get last 3 orders
  const recentOrders = allOrders.sort((a,b) => b.id.localeCompare(a.id)).slice(0,3);


  return {
    totalRevenue,
    totalProducts,
    totalCustomers,
    pendingOrdersCount,
    recentOrders, // We will use this to populate recent activity
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From 'Delivered' orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Currently in store</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingOrdersCount}</div>
            <p className="text-xs text-muted-foreground">'Processing' status</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent store events.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length > 0 ? (
            <ul className="space-y-3">
              {data.recentOrders.map(order => (
                <li key={order.id} className="text-sm text-muted-foreground">
                  New order <span className="font-semibold text-foreground">#{order.id}</span> placed by <span className="font-semibold text-foreground">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</span> for ₹{order.totalAmount.toFixed(2)}.
                </li>
              ))}
               {data.totalCustomers > 0 && (
                 <li className="text-sm text-muted-foreground">
                   Total <span className="font-semibold text-foreground">{data.totalCustomers}</span> customer(s) registered.
                 </li>
               )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
