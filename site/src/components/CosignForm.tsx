import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

export default function CosignForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    // Build GitHub issue body from form data
    const name = data.get('name') as string;
    const org = data.get('org') as string;
    const email = data.get('email') as string;
    const role = data.get('role') as string;
    const areas = data.get('areas') as string;
    const message = data.get('message') as string;

    const issueBody = encodeURIComponent(
      `## Co-Signer Interest\n\n` +
      `**Name:** ${name}\n` +
      `**Organization:** ${org || 'N/A'}\n` +
      `**Role:** ${role || 'N/A'}\n` +
      `**Email:** ${email}\n\n` +
      `### Areas of Interest\n${areas || 'N/A'}\n\n` +
      `### Message\n${message || 'N/A'}\n`
    );

    const issueTitle = encodeURIComponent(`Co-Signer Interest: ${name}${org ? ` (${org})` : ''}`);
    const issueUrl = `https://github.com/EfeDurmaz16/OAPS/issues/new?title=${issueTitle}&body=${issueBody}&labels=cosigner`;

    // Open the GitHub issue in a new tab
    window.open(issueUrl, '_blank');

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-lg font-semibold text-foreground">Thank you for your interest.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A GitHub issue should have opened in a new tab. If it didn't,{' '}
          <a href="https://github.com/EfeDurmaz16/OAPS/issues/new?labels=cosigner" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
            create one manually
          </a>.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Want to discuss further?{' '}
          <a href="https://cal.com/sardis/30min" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
            Book a call
          </a>.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="org">Organization</Label>
          <Input id="org" name="org" placeholder="Company or project" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" name="role" placeholder="e.g. Protocol Engineer" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="areas">Areas of interest</Label>
        <Input id="areas" name="areas" placeholder="e.g. MCP, A2A, payments, identity, provisioning" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea id="message" name="message" rows={4} placeholder="Anything you'd like us to know — what you're building, what you'd like reviewed, how you want to participate." />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-50 self-start"
      >
        {loading ? 'Submitting...' : 'Submit as Co-Signer Interest'}
      </button>

      <Separator className="my-2" />

      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>
          Prefer to go directly?{' '}
          <a href="https://github.com/EfeDurmaz16/OAPS/issues/new?labels=cosigner&title=Co-Signer+Interest" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
            Open a GitHub issue
          </a>
        </p>
        <p>
          Want to talk first?{' '}
          <a href="https://cal.com/sardis/30min" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
            Book a call
          </a>
        </p>
      </div>
    </form>
  );
}
