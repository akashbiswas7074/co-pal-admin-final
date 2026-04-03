"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MapPin, Phone, ExternalLink, Edit, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { ShopDialog } from "./shop-dialogs";
import { getAllShops, deleteShop, toggleShopStatus } from "@/lib/database/actions/shop.actions";
import { IShop } from "@/lib/database/models/shop.model";
import { useRouter } from "next/navigation";

export default function ShopManagerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [shops, setShops] = useState<IShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<IShop | null>(null);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const result = await getAllShops();
      if (result.success) {
        setShops(result.shops);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load shops",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shops",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shop?")) return;

    try {
      const result = await deleteShop(id);
      if (result.success) {
        toast({ title: "Success", description: "Shop deleted successfully" });
        fetchShops();
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete shop", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const result = await toggleShopStatus(id);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        fetchShops();
      } else {
        toast({ title: "Error", description: result.message || "Failed to toggle shop status", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
  };

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Nearby Shops</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your physical store locations for the storefront map locator.
          </p>
        </div>
        <Button onClick={() => { setSelectedShop(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Shop
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shops by name or address..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop Details</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">Loading shops...</p>
                </TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No shops found.
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop) => (
                <TableRow key={shop._id as string}>
                  <TableCell>
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-xs text-muted-foreground max-w-[250px] truncate" title={shop.address}>
                      {shop.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <MapPin className="h-3 w-3 text-red-500" />
                        {shop.latitude.toFixed(6)}, {shop.longitude.toFixed(6)}
                      </div>
                      {shop.googleMapLink && (
                        <a
                          href={shop.googleMapLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Maps
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {shop.phoneNumber}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggle(shop._id as string)}
                      className={`inline-flex px-2 py-1 rounded-full text-[10px] uppercase font-bold transition-colors ${
                        shop.isActive 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {shop.isActive ? "Active" : "Inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => { setSelectedShop(shop); setDialogOpen(true); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(shop._id as string)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ShopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shop={selectedShop}
        onSuccess={fetchShops}
      />
    </div>
  );
}
