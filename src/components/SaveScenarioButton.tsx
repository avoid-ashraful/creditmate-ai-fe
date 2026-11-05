/**
 * Save the current Plan tool state as a server-stored scenario
 * (redesign Phase 3, plan Section 4.8).
 *
 * Signed-in users get a name prompt and a real server row they can reopen
 * from My CreditMate on any device. Signed-out users are told plainly
 * that saving needs an account and routed to sign in — scenarios are
 * never stashed in localStorage and presented as saved.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getPlanCopy } from '../locales/plan';
import { savedService, type SavedScenarioTool } from '../services/saved';

import { Button, PromptDialog, useToast } from './ui';

export interface SaveScenarioButtonProps {
  tool: SavedScenarioTool;
  /** The tool's current inputs, exactly as they appear in the URL. */
  params: Record<string, string>;
}

const SaveScenarioButton: React.FC<SaveScenarioButtonProps> = ({ tool, params }) => {
  const { lang } = useLanguage();
  const copy = getPlanCopy(lang);
  const { status } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (status !== AUTH_STATUS.authenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (name: string) => {
    setOpen(false);
    try {
      await savedService.createScenario({ name: name.trim(), tool, params });
      toast({ message: copy.scenarioSaved });
    } catch {
      toast({ message: copy.scenarioSaveFailed, variant: 'error' });
    }
  };

  return (
    <>
      <Button variant="ghost" onClick={handleClick}>
        {copy.saveScenario}
      </Button>
      <PromptDialog
        open={open}
        title={copy.saveScenario}
        label={copy.scenarioNameLabel}
        submitLabel={copy.saveScenario}
        onSubmit={name => void handleSubmit(name)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export default SaveScenarioButton;
