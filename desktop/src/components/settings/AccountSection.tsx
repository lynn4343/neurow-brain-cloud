"use client";

import { useState } from "react";
import { Trash, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { deleteUserData, deleteAccount } from "@/lib/electron";

// ---------------------------------------------------------------------------
// AccountSection — Delete data + Delete account
//
// Danger zone for destructive account actions.
// Both actions require explicit confirmation via dialog.
// Deletes from Supabase (memories, coaching_sessions, user_profiles).
// Neo4j/Qdrant/Mem0 deletion available via Brain Cloud MCP in production.
// ---------------------------------------------------------------------------

export function AccountSection() {
  const { activeUser, removeProfile } = useUser();
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteData() {
    if (!activeUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteUserData(activeUser.id);
      setDeleteDataOpen(false);
      setDeleteSuccess("data");
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to delete data:", error);
      setDeleteError("Failed to delete data. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!activeUser) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(activeUser.id);
      setDeleteAccountOpen(false);
      setDeleteSuccess("account");
      // Remove from local profiles and switch to next available
      removeProfile(activeUser.slug);
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#1E1E1E] mb-1">
        Account
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your account and data. These actions cannot be undone.
      </p>

      <div className="space-y-4">
        {/* Delete Brain Cloud data */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1E1E1E]">
              Delete Brain Cloud data
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Permanently delete all memories, coaching sessions, and knowledge
              graph data. Your profile and settings will be preserved.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteDataOpen(true)}
          >
            <Trash className="size-4" weight="regular" />
            Delete data
          </Button>
        </div>

        <div className="h-px bg-[#E6E5E3]" />

        {/* Delete account */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1E1E1E]">
              Delete account
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Permanently delete your account, profile, and all associated data
              across all stores. This is irreversible.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteAccountOpen(true)}
          >
            <Trash className="size-4" weight="regular" />
            Delete account
          </Button>
        </div>
      </div>

      {/* Success feedback */}
      {deleteSuccess && (
        <p className="text-sm text-green-600 mt-4">
          {deleteSuccess === "data"
            ? "Brain Cloud data has been deleted."
            : "Account has been deleted. You will be signed out."}
        </p>
      )}

      {/* Error feedback */}
      {deleteError && (
        <p className="text-sm text-red-600 mt-4">{deleteError}</p>
      )}

      {/* Delete Data Confirmation Dialog */}
      <Dialog open={deleteDataOpen} onOpenChange={(open) => !isDeleting && setDeleteDataOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning className="size-5 text-red-500" weight="fill" />
              Delete Brain Cloud data
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all memories, coaching sessions,
              behavioral patterns, and knowledge graph data for{" "}
              <strong>{activeUser?.display_name ?? "this account"}</strong>.
              Your profile and settings will remain intact.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            This action cannot be undone. All data will be removed from
            Supabase, Neo4j, Qdrant, and Mem0.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDataOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteData}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete all data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={(open) => !isDeleting && setDeleteAccountOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warning className="size-5 text-red-500" weight="fill" />
              Delete account
            </DialogTitle>
            <DialogDescription>
              This will permanently delete the account for{" "}
              <strong>{activeUser?.display_name ?? "this user"}</strong>,
              including all profile data, memories, coaching sessions, and
              knowledge graph entries.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            This action cannot be undone. Your entire account and all associated
            data will be permanently removed.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAccountOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
