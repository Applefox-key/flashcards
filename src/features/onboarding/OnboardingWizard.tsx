import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/Button";
import { TagSelect } from "@/components/TagSelect";
import { useAuthStore } from "@/store/authStore";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useCreateCollection } from "@/features/collections/hooks/useCollections";
import { useSetCollectionTags } from "@/features/collections/hooks/useCollectionTags";
import { categoriesApi, contentApi } from "@/api";

const UI_LANGS = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "ua", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "pl", label: "Polski" },
] as const;

// ─── Entry point ────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { user } = useAuthStore();
  const isDemo = useIsDemo();
  const { flashcardsSettings, saveFlashcardsSettings } = useUserSettings();

  const localOnboarded = localStorage.getItem("fm_onboarded") === "true";
  if (!user || isDemo || flashcardsSettings.onboarded || localOnboarded) return null;

  const finish = () => {
    localStorage.setItem("fm_onboarded", "true");
    void saveFlashcardsSettings({ onboarded: true });
  };

  return createPortal(<WizardModal onFinish={finish} />, document.body);
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

type Step = -1 | 0 | 1 | 2 | 3 | 4;

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

  // step 2
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [colLayout, setColLayout] = useState<"standard" | "document">("standard");
  const [colLoading, setColLoading] = useState(false);

  // step 3
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardLoading, setCardLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createCollection = useCreateCollection();
  const setCollectionTags = useSetCollectionTags();

  function handleNextFromStep1() {
    if (!colName.trim()) {
      setColError(t("onboarding.collection_name_required"));
      return;
    }
    setColError("");
    setStep(2);
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    setColLoading(true);
    try {
      let categoryid: number | undefined;
      if (catName.trim()) {
        const cat = await categoriesApi.create(catName.trim());
        categoryid = cat.id;
        void queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
      const col = await createCollection.mutateAsync({ name: colName.trim(), categoryid, layout: colLayout });
      if (tagIds.length > 0) {
        await setCollectionTags.mutateAsync({ collectionId: col.id, tagIds });
      }
      setCollectionId(col.id);
      setCollectionName(colName.trim());
      setStep(3);
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
      setStep(4);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Progress bar — steps 1–3 */}
        {step > 0 && step < 4 && (
          <div className="rounded-t-2xl overflow-hidden">
            <div className="h-1 bg-gray-100 dark:bg-gray-700">
              <div
                className="h-1 bg-indigo-500 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-8 overflow-y-auto max-h-[85vh]">
          {step === -1 && <LangStep onSelect={handleLangSelect} />}

          {step === 0 && <WelcomeStep onStart={() => setStep(1)} onSkip={onFinish} />}

          {step === 1 && (
            <CollectionStep
              colName={colName}
              setColName={setColName}
              catName={catName}
              setCatName={setCatName}
              error={colError}
              onNext={handleNextFromStep1}
              onSkip={onFinish}
            />
          )}

          {step === 2 && (
            <OptionsStep
              tagIds={tagIds}
              setTagIds={setTagIds}
              layout={colLayout}
              setLayout={setColLayout}
              loading={colLoading}
              error={colError}
              onSubmit={handleCreateCollection}
              onBack={() => setStep(1)}
              onSkip={onFinish}
            />
          )}

          {step === 3 && (
            <CardStep
              collectionName={collectionName}
              question={question}
              setQuestion={setQuestion}
              answer={answer}
              setAnswer={setAnswer}
              error={cardError}
              loading={cardLoading}
              onSubmit={handleAddCard}
              onSkip={() => setStep(4)}
            />
          )}

          {step === 4 && (
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

// ─── Step 1: Collection name & category ──────────────────────────────────────

interface CollectionStepProps {
  colName: string;
  setColName: (v: string) => void;
  catName: string;
  setCatName: (v: string) => void;
  error: string;
  onNext: () => void;
  onSkip: () => void;
}

function CollectionStep({ colName, setColName, catName, setCatName, error, onNext, onSkip }: CollectionStepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
        {t("onboarding.step_1_of_3")}
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {t("onboarding.create_collection_title")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("onboarding.create_collection_subtitle")}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("onboarding.create_collection_subtitle_category")}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className="flex flex-col gap-4">
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
          <Button type="submit" disabled={!colName.trim()} className="w-full">
            {t("onboarding.next_btn")}
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

// ─── Step 2: Tags & layout ───────────────────────────────────────────────────

interface OptionsStepProps {
  tagIds: number[];
  setTagIds: (ids: number[]) => void;
  layout: "standard" | "document";
  setLayout: (v: "standard" | "document") => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
}

function OptionsStep({ tagIds, setTagIds, layout, setLayout, loading, error, onSubmit, onBack, onSkip }: OptionsStepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">
        {t("onboarding.step_2_of_3")}
      </p>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        {t("onboarding.collection_options_title")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t("onboarding.collection_options_subtitle")}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.tags_label")}{" "}
            <span className="text-gray-400 font-normal">{t("onboarding.category_optional")}</span>
          </label>
          <TagSelect value={tagIds} onChange={setTagIds} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("onboarding.layout_label")}
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(["standard", "document"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLayout(val)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                  layout === val
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}>
                {val === "standard" ? (
                  <svg
                    width="48"
                    height="30"
                    viewBox="0 0 48 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className={layout === val ? "text-indigo-500" : "text-gray-400"}>
                    <rect x="1" y="1" width="46" height="28" rx="4" />
                    <line x1="8" y1="10" x2="40" y2="10" />
                    <line x1="8" y1="16" x2="32" y2="16" />
                  </svg>
                ) : (
                  <svg
                    width="28"
                    height="40"
                    viewBox="0 0 28 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className={layout === val ? "text-indigo-500" : "text-gray-400"}>
                    <rect x="1" y="1" width="26" height="38" rx="4" />
                    <line x1="5" y1="9" x2="23" y2="9" />
                    <line x1="5" y1="15" x2="23" y2="15" />
                    <line x1="5" y1="21" x2="19" y2="21" />
                    <line x1="5" y1="27" x2="23" y2="27" />
                    <line x1="5" y1="33" x2="17" y2="33" />
                  </svg>
                )}
                <span
                  className={`font-medium text-xs ${layout === val ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"}`}>
                  {t(`onboarding.layout_${val}` as const)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {t(`onboarding.layout_${val}_desc` as const)}
                </span>
              </button>
            ))}
          </div>
          {layout === "document" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {t("onboarding.layout_document_note")}
            </p>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" loading={loading} className="w-full">
            {t("onboarding.create_collection_btn")}
          </Button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1">
              {t("onboarding.back_btn")}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1">
              {t("onboarding.skip_tutorial")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Step 3: Add first card ──────────────────────────────────────────────────

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
        {t("onboarding.step_3_of_3")}
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

// ─── Step 4: Done ────────────────────────────────────────────────────────────

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
