"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "@/app/compte/actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, undefined);
  const [value, setValue] = useState("");
  const ready = value.trim().toUpperCase() === "SUPPRIMER";

  return (
    <form action={action} className="space-y-3">
      <label htmlFor="confirm" className="block text-sm text-slate-300">
        Pour confirmer, tape <strong className="text-white">SUPPRIMER</strong> :
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="confirm"
          name="confirm"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={!ready || pending}
          className="btn border border-danger/50 bg-danger/10 py-2.5 text-danger hover:bg-danger/20"
        >
          {pending ? "Suppression…" : "Supprimer définitivement mon compte"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
