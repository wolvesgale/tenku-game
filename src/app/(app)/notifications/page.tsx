import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-[#0F0F1A]/95 backdrop-blur-lg border-b border-[#2A2A45] px-4 py-4">
        <h1 className="font-bold text-white text-lg">通知</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mb-4">
          <Bell className="w-7 h-7 text-violet-400" />
        </div>
        <p className="font-semibold text-white mb-1">通知はありません</p>
        <p className="text-sm text-gray-600">新しい通知が届くとここに表示されます</p>
      </div>
    </div>
  );
}
