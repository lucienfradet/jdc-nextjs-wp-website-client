import SubscriberStatusChecker from '@/components/SubscriberStatusChecker';

export default function SubscriberStatusPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Check Subscriber Status</h1>
      <SubscriberStatusChecker />
    </div>
  );
}
