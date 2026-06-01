"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Info } from "lucide-react";
import { IShop } from "@/lib/database/models/shop.model";
import { createShop, updateShop } from "@/lib/database/actions/shop.actions";

const shopSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  googleMapLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  isActive: z.boolean().default(true),
});

type ShopFormValues = z.infer<typeof shopSchema>;

interface ShopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop?: IShop | null;
  onSuccess: () => void;
}

export function ShopDialog({ open, onOpenChange, shop, onSuccess }: ShopDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
      googleMapLink: "",
      latitude: 0,
      longitude: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name,
        address: shop.address,
        phoneNumber: shop.phoneNumber,
        googleMapLink: shop.googleMapLink || "",
        latitude: shop.latitude,
        longitude: shop.longitude,
        isActive: shop.isActive,
      });
    } else {
      form.reset({
        name: "",
        address: "",
        phoneNumber: "",
        googleMapLink: "",
        latitude: 0,
        longitude: 0,
        isActive: true,
      });
    }
  }, [shop, form, open]);

  const onSubmit = async (data: ShopFormValues) => {
    setSubmitting(true);
    try {
      let result;
      if (shop) {
        result = await updateShop(shop._id as string, data);
      } else {
        result = await createShop(data);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: shop ? "Shop updated successfully" : "Shop created successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shop",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{shop ? "Edit Shop" : "Add New Shop"}</DialogTitle>
          <DialogDescription>
            Enter the details of the physical shop location.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Street Branch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Shopping St, City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="googleMapLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://maps.google.com/..." {...field} />
                  </FormControl>
                  <FormDescription>Link for users to open in their maps app.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
              <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                Coordinates (Required for locator)
              </div>
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2 flex items-start gap-2 mt-2 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                <Info className="h-3 w-3 mt-0.5" />
                <p>
                  Right-click any location on Google Maps to find these coordinates.
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Shown on the storefront map locator.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {shop ? "Update Shop" : "Add Shop"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
