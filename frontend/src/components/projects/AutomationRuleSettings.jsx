import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { automationRuleApi } from '../../api/automationRuleApi';
import { workflowStatusApi } from '../../api/workflowStatusApi';
import { projectApi } from '../../api/projectApi';
import { Button } from '../ui/button';
import { cn, fieldClass } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest'];
const TYPES = ['task', 'story', 'bug', 'epic', 'subtask'];

const TRIGGER_LABELS = {
  issue_created: 'Issue created',
  issue_status_changed: 'Status changed',
  issue_assigned: 'Issue assigned',
  comment_added: 'Comment added',
};
const CONDITION_FIELD_LABELS = { statusId: 'Status', priority: 'Priority', type: 'Type' };
const ACTION_TYPE_LABELS = {
  set_status: 'Set status',
  assign_to: 'Assign to',
  assign_to_reporter: 'Assign to reporter',
  add_comment: 'Add comment',
  set_priority: 'Set priority',
};

const selectClass = cn('px-2 py-2 text-sm cursor-pointer', fieldClass);

export default function AutomationRuleSettings({ projectId }) {
  const [rules, setRules] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('issue_created');
  const [conditionField, setConditionField] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('add_comment');
  const [actionValue, setActionValue] = useState('');
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const statusById = Object.fromEntries(statuses.map((s) => [s._id, s]));
  const memberById = Object.fromEntries(members.filter((m) => m.userId).map((m) => [m.userId._id, m.userId]));

  const load = () => automationRuleApi.list(projectId).then(setRules);

  useEffect(() => {
    load();
    workflowStatusApi.list(projectId).then(setStatuses);
    projectApi.listMembers(projectId).then(setMembers);
  }, [projectId]);

  const resetForm = () => {
    setName('');
    setConditionField('');
    setConditionValue('');
    setActionValue('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      await automationRuleApi.create(projectId, {
        name,
        trigger,
        conditionField: conditionField || null,
        conditionValue: conditionField ? conditionValue : null,
        actionType,
        actionValue: actionType === 'assign_to_reporter' ? null : actionValue,
      });
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add rule');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleEnabled = async (rule) => {
    await automationRuleApi.update(projectId, rule._id, { enabled: !rule.enabled });
    load();
  };

  const handleRemove = async (id) => {
    if (!(await confirm('Delete this automation rule?', { confirmLabel: 'Delete' }))) return;
    try {
      await automationRuleApi.remove(projectId, id);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleReorder = async (rule, direction) => {
    const sorted = [...rules].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((r) => r._id === rule._id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const other = sorted[swapIndex];
    await Promise.all([
      automationRuleApi.update(projectId, rule._id, { order: other.order }),
      automationRuleApi.update(projectId, other._id, { order: rule.order }),
    ]);
    load();
  };

  const valueLabel = (field, value) => {
    if (field === 'statusId') return statusById[value]?.name || value;
    if (field === 'assign_to') return memberById[value]?.name || value;
    return value;
  };

  const summarize = (rule) => {
    let text = `When ${TRIGGER_LABELS[rule.trigger] || rule.trigger}`;
    if (rule.conditionField) {
      text += ` if ${CONDITION_FIELD_LABELS[rule.conditionField]} is ${valueLabel(rule.conditionField, rule.conditionValue)}`;
    }
    text += ` → ${ACTION_TYPE_LABELS[rule.actionType] || rule.actionType}`;
    if (rule.actionType === 'assign_to') text += ` ${valueLabel('assign_to', rule.actionValue)}`;
    else if (rule.actionType === 'set_status') text += ` ${valueLabel('statusId', rule.actionValue)}`;
    else if (rule.actionType === 'add_comment' && rule.actionValue) text += `: "${rule.actionValue}"`;
    else if (rule.actionType === 'set_priority' && rule.actionValue) text += ` ${rule.actionValue}`;
    return text;
  };

  const sorted = [...rules].sort((a, b) => a.order - b.order);

  const renderValueControl = (field, value, onChange) => {
    if (field === 'statusId') {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} required>
          <option value="" disabled>
            Choose status
          </option>
          {statuses.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }
    if (field === 'priority') {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} required>
          <option value="" disabled>
            Choose priority
          </option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      );
    }
    if (field === 'type') {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} required>
          <option value="" disabled>
            Choose type
          </option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      );
    }
    return null;
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <Zap className="size-4 text-slate-400 dark:text-slate-500" />
        Automation Rules
      </h3>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {sorted.map((rule, i) => (
          <li key={rule._id} className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => handleToggleEnabled(rule)}
                className="size-4 cursor-pointer"
              />
            </label>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{rule.name}</div>
              <div className="text-slate-400 dark:text-slate-500 text-xs truncate">{summarize(rule)}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleReorder(rule, -1)}
                disabled={i === 0}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                onClick={() => handleReorder(rule, 1)}
                disabled={i === sorted.length - 1}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronDown className="size-4" />
              </button>
              <button
                onClick={() => handleRemove(rule._id)}
                className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors duration-150 ml-1"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
        {sorted.length === 0 && <li className="p-4 text-sm text-slate-400 dark:text-slate-500 text-center">No automation rules yet.</li>}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rule name (e.g. Auto-assign done issues)"
          className={cn('px-3 py-2 text-sm', fieldClass)}
          required
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">When</span>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className={selectClass}>
            {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">If</span>
          <select
            value={conditionField}
            onChange={(e) => {
              setConditionField(e.target.value);
              setConditionValue('');
            }}
            className={selectClass}
          >
            <option value="">(no condition)</option>
            {Object.entries(CONDITION_FIELD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {conditionField && (
            <span className="flex items-center gap-2 animate-slide-down">
              <span className="text-xs text-slate-500 dark:text-slate-400">is</span>
              {renderValueControl(conditionField, conditionValue, setConditionValue)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Then</span>
          <select
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value);
              setActionValue('');
            }}
            className={selectClass}
          >
            {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {actionType === 'set_status' && renderValueControl('statusId', actionValue, setActionValue)}
          {actionType === 'set_priority' && renderValueControl('priority', actionValue, setActionValue)}
          {actionType === 'assign_to' && (
            <select value={actionValue} onChange={(e) => setActionValue(e.target.value)} className={selectClass} required>
              <option value="" disabled>
                Choose member
              </option>
              {members
                .filter((m) => m.userId)
                .map((m) => (
                  <option key={m.userId._id} value={m.userId._id}>
                    {m.userId.name}
                  </option>
                ))}
            </select>
          )}
          {actionType === 'add_comment' && (
            <input
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder="Comment text"
              className={cn('flex-1 px-2 py-1.5 text-sm min-w-[160px]', fieldClass)}
              required
            />
          )}
        </div>

        <Button type="submit" loading={adding} className="self-start">
          {!adding && <Plus className="size-4" />}
          Add rule
        </Button>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 animate-slide-down">{error}</p>}
    </div>
  );
}
