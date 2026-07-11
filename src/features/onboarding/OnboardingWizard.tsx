import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/authStore";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useCreateCollection } from "@/features/collections/hooks/useCollections";
import { categoriesApi, contentApi } from "@/api";

const UI_LANGS = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "uk", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
] as const;

// ─── Entry point ────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { user } = useAuthStore();
  const isDemo = useIsDemo();
  const { flashcardsSettings, saveFlashcardsSettings } = useUserSettings();

  if (!user || isDemo || flashcardsSettings.onboarded) return null;

  const finish = () => void saveFlashcardsSettings({ onboarded: true });

  return createPortal(<WizardModal onFinish={finish} />, document.body);
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

type Step = -1 | 0 | 1 | 2 | 3;

function WizardModal({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const { saveLangUI } = useUserSettings();
  const [step, setStep] = useState<Step>(-1);

  function handleLangSelect(code: string) {
    void saveLangUI(code);
    setStep(0);
  }

  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [collectionName, setCollectionName] = useState("");

  // step 1
  const [colName, setColName] = useState("");
  const [catName, setCatName] = useState("");
  const [colError, setColError] = useState("");
  const [colLoading, setColLoading] = useState(false);

  // step 2
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardLoading, setCardLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCollection = useCreateCollection();

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!colName.trim()) {
      setColError(t("onboarding.collection_name_required"));
      return;
    }
    setColError("");
    setColLoading(true);
    try {
      let categoryid: number | undefined;
      if (catName.trim()) {
        const cat = await categoriesApi.create(catName.trim());
        categoryid = cat.id;
        void queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
      const col = await createCollection.mutateAsync({ name: colName.trim(), categoryid });
      setCollectionId(col.id);
      setCollectionName(colName.trim());
      setStep(2);
    } catch {
      setColError(t("onboarding.collection_create_error"));
    } finally {
      setColLoading(false);
    }
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!collectionId) return;
    setCardError("");
    setCardLoading(true);
    try {
      await contentApi.addToCollection(collectionId, {
        question: question.trim(),
        answer: answer.trim(),
      });
      void queryClient.invalidateQueries({ queryKey: ["collections", collectionId, "content"] });
    } catch {
      setCardError(t("onboarding.card_save_error"));
    } finally {
      setCardLoading(false);
      setStep(3);
    }
  }

  function handleGoToCollection() {
    if (collectionId) navigate(`/collections/${collectionId}`);
    onFinish();
  }

  function handleGoToLibrary() {
    navigate("/library");
    onFinish();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Progress bar — steps 1 and 2 */}
        {step > 0 && step < 3 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-700">
            <div className="h-1 bg-indigo-500 transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }} />
          </div>
        )}

        <div className="p-8">
          {step === -1 && <LangStep onSelect={handleLangSelect} />}

          {step === 0 && <WelcomeStep onStart={() => setStep(1)} onSkip={onFinish} />}

          {step === 1 && (
            <CollectionStep
              colName={colName}
              setColName={setColName}
              catName={catName}
              setCatName={setCatName}
              error={colError}
              loading={colLoading}
              onSubmit={handleCreateCollection}
              onSkip={onFinish}
            />
          )}

          {step === 2 && (
            <CardStep
              collectionName={collectionName}
              question={question}
              setQuestion={setQuestion}
              answer={answer}
              setAnswer={setAnswer}
              error={cardError}
              loading={cardLoading}
              onSubmit={handleAddCard}
              onSkip={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <DoneStep
              collectionName={collectionName}
              onGoToCollection={handleGoToCollection}
              onGoToLibrary={handleGoToLibrary}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step -1: Language picker ────────────────────────────────────────────────

function LangStep({ onSelect }: { onSelect: (code: string) => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Choose your language</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-7">Выберите язык / Оберіть мову / Elige idioma</p>
      <div className="flex flex-col gap-2">
        {UI_LANGS.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:border-indigo-500 transition-colors font-medium text-sm text-left">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 0: Welcome ─────────────────────────────────────────────────────────

function WelcomeStep({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M12 4v16M2 12h20" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("onboarding.welcome_title")}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t("onboarding.welcome_subtitle")}</p>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onStart} className="w-full">
          {t("onboarding.lets_start")}
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {t("onboarding.skip_tutorial")}
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: Create collection ───────────────────────────────────────────────

interface CollectionStepProps {
  colName: string;
  setColName: (v: string) => void;
  catName: string;
  setCatName: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}

function CollectionStep({
  colName,
  setColName,
  catName,
  setCatName,
  error,
  loading,
  onSubmit,
  onSkip,
}: CollectionStepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
        {t("onboarding.step_1_of_2")}
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {t("onboarding.create_collection_title")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("onboarding.create_collection_subtitle")}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("onboarding.create_collection_subtitle_category")}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.collection_name_label")} <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            placeholder={t("onboarding.collection_name_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.category_label")}{" "}
            <span className="text-gray-400 font-normal">{t("onboarding.category_optional")}</span>
          </label>
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder={t("onboarding.category_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" loading={loading} disabled={!colName.trim()} className="w-full">
            {t("onboarding.create_collection_btn")}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center py-1">
            {t("onboarding.skip_tutorial")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Step 2: Add first card ──────────────────────────────────────────────────

interface CardStepProps {
  collectionName: string;
  question: string;
  setQuestion: (v: string) => void;
  answer: string;
  setAnswer: (v: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}

function CardStep({
  collectionName,
  question,
  setQuestion,
  answer,
  setAnswer,
  error,
  loading,
  onSubmit,
  onSkip,
}: CardStepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
        {t("onboarding.step_2_of_2")}
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t("onboarding.add_card_title")}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("onboarding.add_card_subtitle")}{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">"{collectionName}"</span>
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.question_label")} <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("onboarding.question_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.answer_label")} <span className="text-red-500">*</span>
          </label>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("onboarding.answer_placeholder")}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" loading={loading} disabled={!question.trim() || !answer.trim()} className="w-full">
            {t("onboarding.add_card_btn")}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center py-1">
            {t("onboarding.skip_step")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Step 3: Done ────────────────────────────────────────────────────────────

interface DoneStepProps {
  collectionName: string;
  onGoToCollection: () => void;
  onGoToLibrary: () => void;
}

function DoneStep({ collectionName, onGoToCollection, onGoToLibrary }: DoneStepProps) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("onboarding.done_title")}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        <span className="font-medium text-gray-700 dark:text-gray-300">"{collectionName}"</span>{" "}
        {t("onboarding.done_subtitle")}
      </p>
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onGoToCollection} className="w-full">
          {t("onboarding.go_to_collection")}
        </Button>
        <Button size="lg" variant="secondary" onClick={onGoToLibrary} className="w-full">
          {t("onboarding.go_to_library")}
        </Button>
      </div>
    </div>
  );
}
