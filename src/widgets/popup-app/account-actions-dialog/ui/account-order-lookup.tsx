import { useState } from "react";

import { AppText, TAG } from "@/ui/app-text";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import { ACCOUNT_PAGE_TEXT } from "@/shared/constants/text";

import { AccountOrderDetail } from "./account-order-detail";

export const AccountOrderLookup = () => {
  const [query, setQuery] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim().replace(/^#+/, "");
    if (!t) {
      return;
    }
    setSubmittedId(t);
  };

  const handleReset = () => {
    setSubmittedId(null);
    setQuery("");
  };

  if (submittedId) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-3 px-4 pb-4">
        <AccountOrderDetail orderId={submittedId} />
        <Button
          type="button"
          variant="popupSubmit"
          size="popupSubmit"
          onClick={handleReset}
        >
          {ACCOUNT_PAGE_TEXT.findOrderAgain}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full min-w-0 flex-col gap-3 px-4 pb-4"
    >
      <AppText
        tag={TAG.p}
        variant="popupBody"
        size="popupBody"
        className="!text-left"
      >
        {ACCOUNT_PAGE_TEXT.findOrderHint}
      </AppText>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        variant="form"
        type="search"
        autoComplete="off"
        placeholder={ACCOUNT_PAGE_TEXT.findOrderPlaceholder}
        enterKeyHint="search"
      />
      <Button type="submit" variant="popupSubmit" size="popupSubmit">
        {ACCOUNT_PAGE_TEXT.findOrderSubmit}
      </Button>
    </form>
  );
};
