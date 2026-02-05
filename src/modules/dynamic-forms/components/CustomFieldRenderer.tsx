import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomFieldDefinition } from '../types';

interface CustomFieldRendererProps {
  field: CustomFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CustomFieldRenderer({ field, value, onChange }: CustomFieldRendererProps) {
  const fieldId = `custom-${field.field_key}`;
  const required = field.is_required;

  switch (field.field_type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label} {required && '*'}
          </Label>
          <Input
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            maxLength={500}
          />
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label} {required && '*'}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder || ''}
            required={required}
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label} {required && '*'}
          </Label>
          <Textarea
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            required={required}
            rows={3}
            maxLength={2000}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label} {required && '*'}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder={field.placeholder || 'Seçiniz...'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id={fieldId}
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={fieldId} className="cursor-pointer">
            {field.field_label}
          </Label>
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label} {required && '*'}
          </Label>
          <Input
            id={fieldId}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          />
        </div>
      );

    default:
      return null;
  }
}
