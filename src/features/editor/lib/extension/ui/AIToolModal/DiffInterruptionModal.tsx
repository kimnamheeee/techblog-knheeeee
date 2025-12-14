import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { overlay } from "overlay-kit";

interface DiffInterruptionModalOptions {
  reason: "cancel-generation" | "discard-result";
}

const reasonBy = {
  "cancel-generation": {
    title: "AI가 아직 작업 중입니다",
    description: "지금 취소하면 작업 결과가 사라집니다. 취소하시겠습니까?",
  },
  "discard-result": {
    title: "아직 적용되지 않은 변경 사항이 있습니다",
    description: "이 diff를 적용하지 않고 취소하시겠습니까?",
  },
};

export async function openDiffInterruptionModal({
  reason,
}: DiffInterruptionModalOptions): Promise<boolean> {
  const result = await overlay.openAsync<boolean>(({ isOpen, close }) => (
    <Dialog open={isOpen} onOpenChange={() => close(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reasonBy[reason].title}</DialogTitle>
          <DialogDescription>{reasonBy[reason].description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => {
              close(true);
            }}
          >
            확인
          </Button>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={() => {
                close(false);
              }}
            >
              취소
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ));

  return result;
}
