import { Send } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddPurchaseRequestComment } from "../hooks/use-purchase-request-mutations";

export function CommentBox({ purchaseRequestId }: { purchaseRequestId: string }) {
  const [message, setMessage] = React.useState("");
  const addComment = useAddPurchaseRequestComment(purchaseRequestId);

  function handleSubmit() {
    if (!message.trim()) return;
    addComment.mutate(message, { onSuccess: () => setMessage("") });
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Adicione um comentário..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={2}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || addComment.isPending}>
          <Send className="h-3.5 w-3.5" /> Comentar
        </Button>
      </div>
    </div>
  );
}
