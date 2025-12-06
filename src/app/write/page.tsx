import {
  ContentEditor,
  ContentPreview,
  PostTitleInput,
} from "@/features/editor";
import Divider from "@/shared/ui/Divider";

export default function Write() {
  return (
    <div className="flex px-8 py-6 gap-8">
      <div className="flex flex-col gap-8 w-full max-w-1/2">
        <PostTitleInput />
        <Divider />
        <ContentEditor />
      </div>
      <ContentPreview />
    </div>
  );
}
