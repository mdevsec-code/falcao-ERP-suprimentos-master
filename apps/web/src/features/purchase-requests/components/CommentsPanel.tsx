import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatDateTime, getInitials, relativeTime } from '@/utils/format';
import { useAddPurchaseRequestComment } from '../hooks/usePurchaseRequestMutations';
import type { PurchaseRequestCommentDto } from '../types';

interface CommentsPanelProps {
  purchaseRequestId: string;
  comments: readonly PurchaseRequestCommentDto[];
  canComment: boolean;
}

export function CommentsPanel({ purchaseRequestId, comments, canComment }: CommentsPanelProps) {
  const { t } = useTranslation('purchaseRequests');
  const [message, setMessage] = useState('');
  const addComment = useAddPurchaseRequestComment(purchaseRequestId);

  function handleSubmit() {
    const text = message.trim();
    if (!text) return;
    addComment.mutate(text, { onSuccess: () => setMessage('') });
  }

  return (
    <div className="space-y-4">
      {canComment && (
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <Textarea
            label={t('purchaseRequests:comments.newLabel')}
            placeholder={t('purchaseRequests:comments.placeholder')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) handleSubmit();
            }}
            rows={2}
            maxLength={2000}
            name="comment-message"
            hint={t('purchaseRequests:comments.hint')}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              onClick={handleSubmit}
              disabled={!message.trim()}
              isLoading={addComment.isPending}
            >
              {t('purchaseRequests:comments.submit')}
            </Button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title={t('purchaseRequests:comments.emptyTitle')}
          description={t('purchaseRequests:comments.emptyDescription')}
        />
      ) : (
        <ul className="space-y-3">
          {comments.map((comment, idx) => (
            <li
              key={comment.id}
              className="flex animate-slide-up gap-3"
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                  <time
                    dateTime={comment.createdAt}
                    title={formatDateTime(comment.createdAt) ?? ''}
                    className="text-xs text-ink-soft"
                  >
                    {relativeTime(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{comment.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
