"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  Group, 
  Text, 
  ActionIcon, 
  Button, 
  Badge, 
  Card, 
  Title, 
  Tooltip,
  Modal,
  Box,
  Divider,
  Stack
} from "@mantine/core";
import { 
  Plus, 
  Edit, 
  Trash, 
  Eye, 
  ExternalLink, 
  Search,
  FileText,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getAllCustomPages, deleteCustomPage } from "@/lib/database/actions/admin/custom-pages.actions";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function CustomPagesPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await getAllCustomPages();
      if (res.success) {
        setPages(res.pages);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Failed to fetch custom pages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async () => {
    if (!pageToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteCustomPage(pageToDelete._id);
      if (res.success) {
        toast.success(res.message);
        setPages(pages.filter(p => p._id !== pageToDelete._id));
        setDeleteModalOpened(false);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("An error occurred during deletion");
    } finally {
      setDeleting(false);
    }
  };

  const rows = pages.map((page) => (
    <Table.Tr key={page._id}>
      <Table.Td>
        <Group gap="sm">
          <Box className="bg-blue-50 p-2 rounded-md">
            <FileText size={18} className="text-blue-500" />
          </Box>
          <div>
            <Text size="sm" fw={600}>{page.title}</Text>
            <Text size="xs" c="dimmed">{page.slug}</Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge 
          color={page.isActive ? "green" : "gray"} 
          variant="light"
          radius="sm"
        >
          {page.isActive ? "Active" : "Inactive"}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {format(new Date(page.updatedAt), "MMM dd, yyyy HH:mm")}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={0} justify="flex-end">
          <Tooltip label="View Page">
            <ActionIcon 
              variant="subtle" 
              color="blue"
              onClick={() => window.open(`http://localhost:3000/page/${page.slug}`, '_blank')}
            >
              <ExternalLink size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit Page">
            <ActionIcon 
              variant="subtle" 
              color="gray"
              component={Link}
              href={`/admin/dashboard/custom-pages/edit/${page._id}`}
            >
              <Edit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Page">
            <ActionIcon 
              variant="subtle" 
              color="red"
              onClick={() => {
                setPageToDelete(page);
                setDeleteModalOpened(true);
              }}
            >
              <Trash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div className="p-2 sm:p-6 lg:p-8 space-y-6">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2} className="text-2xl sm:text-3xl font-bold tracking-tight">Custom Pages</Title>
          <Text c="dimmed" size="sm">Manage dynamic content pages like About Us, Mission, or Policies.</Text>
        </div>
        <Button 
          component={Link} 
          href="/admin/dashboard/custom-pages/create"
          leftSection={<Plus size={18} />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create New Page
        </Button>
      </Group>

      <Card withBorder padding="xl" radius="md" className="shadow-sm overflow-hidden border-gray-200">
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead className="bg-gray-50/50">
              <Table.Tr>
                <Table.Th>Page Title & Slug</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last Updated</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text ta="center" py="xl" c="dimmed italic">Loading custom pages...</Text>
                  </Table.Td>
                </Table.Tr>
              ) : pages.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Stack align="center" py="xl" gap="sm">
                      <AlertCircle size={32} className="text-gray-300" />
                      <Text c="dimmed">No custom pages found. Create your first one!</Text>
                      <Button 
                        variant="light" 
                        component={Link} 
                        href="/admin/dashboard/custom-pages/create"
                        size="xs"
                      >
                        Get Started
                      </Button>
                    </Stack>
                  </Table.Td>
                </Table.Tr>
              ) : (
                rows
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirm Deletion"
        centered
        radius="md"
        padding="lg"
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete <Text span fw={700}>"{pageToDelete?.title}"</Text>? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>Delete Permanently</Button>
        </Group>
      </Modal>
    </div>
  );
}
