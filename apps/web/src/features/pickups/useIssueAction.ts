import type { VisitDto } from '@kontora/contracts';
import { useSetIssued } from '../../api/queries';
import { useToast } from '../../shared/ui/Feedback';

/** Видача / скасування видачі з тостом і кнопкою «Скасувати». */
export function useIssueAction() {
  const setIssued = useSetIssued();
  const toast = useToast();

  const run = async (visit: VisitDto, issued: boolean) => {
    try {
      await setIssued.mutateAsync({ id: visit.id, issued });
      toast(issued ? `${visit.ref}: документ видано` : `${visit.ref}: видачу скасовано`, {
        action: { label: 'Скасувати', onClick: () => void run(visit, !issued) },
      });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не вдалося оновити статус', { tone: 'error' });
    }
  };

  return { run, pendingId: setIssued.isPending ? setIssued.variables?.id : undefined };
}
