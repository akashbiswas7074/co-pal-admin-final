
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getStatsTickerData, updateStatsTickerData } from "@/lib/database/actions/stats-ticker.actions";
import StatsTickerForm from "@/components/admin/dashboard/stats-ticker/StatsTickerForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function StatsTickerPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getStatsTickerData();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to fetch Stats Ticker data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (formData: any) => {
        setSaving(true);
        try {
            const res = await updateStatsTickerData(formData);
            if (res.success) {
                toast.success(res.message);
                setData(res.data);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Stats Ticker Management</h1>
                <p className="text-muted-foreground">
                    Manage the moving band items and styling on your homepage.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                </div>
            ) : (
                <Card className="max-w-4xl border shadow-sm">
                    <CardHeader>
                        <CardTitle>Ticker Settings</CardTitle>
                        <CardDescription>
                            Configure the items, emojis, and overall appearance of the scrolling ticker.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StatsTickerForm
                            initialData={data}
                            onSubmit={handleSubmit}
                            onCancel={() => fetchData()}
                            loading={saving}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
