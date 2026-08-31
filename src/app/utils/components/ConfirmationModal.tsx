"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/utils/components/Dialog";
import { Button } from "@/app/utils/components/Button";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "Do you really want to proceed?",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="mt-2 text-md text-gray-600">
          {message}
        </DialogDescription>

        <DialogFooter className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-[#103BB5] text-white hover:bg-[#256b45]"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
