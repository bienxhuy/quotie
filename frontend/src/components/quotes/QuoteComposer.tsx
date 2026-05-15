import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CreateQuoteSchema } from "@/schemas/quote.schema";

type CreateQuoteValues = z.infer<typeof CreateQuoteSchema>;

type QuoteComposerProps = {
  isAuthenticated: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: CreateQuoteValues) => Promise<boolean>;
  onLogin: () => void;
};

export function QuoteComposer({
  isAuthenticated,
  isSubmitting,
  submitError,
  onSubmit,
  onLogin,
}: QuoteComposerProps) {
  const form = useForm<CreateQuoteValues>({
    resolver: zodResolver(CreateQuoteSchema),
    defaultValues: {
      text: "",
    },
  });

  const textValue = form.watch("text") ?? "";
  const isDisabled = !isAuthenticated || isSubmitting;

  const handleSubmit = async (values: CreateQuoteValues) => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }

    const success = await onSubmit(values);
    if (success) {
      form.reset();
    }
  };

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>Login required to share a quote.</span>
          <Button
            type="button"
            onClick={onLogin}
            disabled={isSubmitting}
            className="h-8 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/80 transition-all hover:border-cyan-400/40 hover:text-white"
          >
            Login to post
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Quote text</FormLabel>
                <FormControl>
                  <textarea
                    id="quote-textarea"
                    placeholder="Write a quote worth remembering..."
                    disabled={isDisabled}
                    className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 focus-visible:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-300" />
              </FormItem>
            )}
          />

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-white/40">{textValue.length}/500</span>
            <Button
              id="quote-submit-button"
              type="submit"
              className="h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(34,211,238,0.35)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-400 hover:shadow-[0_16px_30px_rgba(34,211,238,0.45)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={isDisabled}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </span>
              ) : (
                "Post quote"
              )}
            </Button>
          </div>
          <p className="text-xs text-white/40">New quotes appear after refresh.</p>
        </form>
      </Form>
    </div>
  );
}
